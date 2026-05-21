// Merge all extracted drug JSON files into one deduplicated list
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'extracted');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const all = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const d of data) all.push(d);
}

console.error(`Loaded ${all.length} entries from ${files.length} files`);

// Normalize a drug name into a dedup key
function normName(n) {
  if (!n) return '';
  return n.toLowerCase()
    .replace(/\([^)]*\)/g, '')          // remove parentheticals
    .replace(/[^a-z0-9]+/g, ' ')        // collapse non-alphanum
    .trim();
}

// Aliases: map various ways drug names appear to canonical
const aliases = {
  'acei':'ace inhibitors','ace inhibitor':'ace inhibitors',
  'arb':'arbs','angiotensin ii receptor blocker':'arbs','angiotensin receptor blockers':'arbs','losartan':'losartan',
  'loop diuretics':'loop diuretics','loop diuretic':'loop diuretics','loop diuretics furosemide':'furosemide',
  'thiazide diuretic':'thiazide diuretics',
  'k sparing diuretic':'k-sparing diuretics','potassium sparing diuretics':'k-sparing diuretics','potassium sparing diuretic':'k-sparing diuretics',
  'nsaid':'nsaids',
  'aspirin salicylates':'aspirin',
  'ibuprofen':'ibuprofen',
  'sgl t2 inhibitors':'sglt2 inhibitors','sglt 2 inhibitors':'sglt2 inhibitors','sglt2 inhibitor':'sglt2 inhibitors',
  'glp 1 receptor agonists':'glp-1 receptor agonists','glp 1 receptor agonist':'glp-1 receptor agonists',
  'beta 2 agonists albuterol':'albuterol','beta 2 adrenergic agonist':'beta-2 agonists',
  'beta adrenergic agonists':'beta-2 agonists',
  'corticosteroids glucocorticoids class':'corticosteroids','glucocorticoid':'corticosteroids','corticosteroid':'corticosteroids',
  'adh vasopressin':'vasopressin (adh)','antidiuretic hormone adh vasopressin':'vasopressin (adh)',
  'desmopressin ddavp':'desmopressin','ddavp':'desmopressin',
  'fluoroquinolone':'fluoroquinolones','fluoroquinolones':'fluoroquinolones',
  'corticosteroids glucocorticoids':'corticosteroids',
  'sgl t 2 inhibitors':'sglt2 inhibitors',
  'thiazide diuretics hydrochlorothiazide':'hydrochlorothiazide',
  'protease inhibitors hcv':'protease inhibitors (hcv)',
  'polymerase inhibitors hcv':'polymerase inhibitors (hcv)',
  'non steroidal mras nsmras finerenone':'finerenone',
  '0 9 nacl normal saline':'normal saline','normal saline iv fluids':'normal saline','isotonic saline':'normal saline','isotonic saline normal saline':'normal saline','normal saline isotonic':'normal saline',
  '3 hypertonic saline':'hypertonic saline (3%)',
  '0 45 nacl half normal saline':'half-normal saline (0.45%)',
  'd5w 5 dextrose in water':'d5w',
  'lactated ringer s':"lactated ringer's",
  'sodium polystyrene sulfonate kayexalate':'sodium polystyrene sulfonate',
  'bacillus calmette guerin bcg':'bcg',
  'topical vaginal estrogen':'topical vaginal estrogen',
  'gold auranofin':'gold (auranofin)',
  'interleukin 2 aldesleukin':'interleukin-2 (aldesleukin)',
  'methoxy polyethylene glycol epoetin beta':'methoxy polyethylene glycol-epoetin beta',
  'erythropoietin epo':'erythropoietin',
  'mdma ecstasy':'mdma',
  'sulfonylureas glyburide':'glyburide','glyburide sulfonylurea':'glyburide',
  'vitamin d 1 25 dihydroxyvitamin d':'calcitriol',
  'tissue plasminogen activator tpa':'tpa',
  'sulfamethoxazole trimethoprim':'trimethoprim-sulfamethoxazole','trimethoprim sulfamethoxazole tmp smx':'trimethoprim-sulfamethoxazole','trimethoprim sulfamethoxazole':'trimethoprim-sulfamethoxazole',
  'alcohol ethanol cns depressant context':'ethanol',
  'sedatives benzodiazepines':'benzodiazepines',
  'prostaglandins pge 2 pgi 2':'prostaglandins',
  'iron oral and iv':'iron (oral/iv)',
  'penicillin v':'penicillin v',
  'calcium oral':'calcium (oral)',
  'phosphate oral iv':'phosphate (oral/iv)',
  'sgl t 2 inhibitors':'sglt2 inhibitors',
  'progestins pregnancy':'progestins',
  'iv radiocontrast':'iodinated contrast','radiocontrast agents':'iodinated contrast',
  'aspirin':'aspirin',
};

function canonical(name) {
  const norm = normName(name);
  if (aliases[norm]) return aliases[norm];
  return norm;
}

// Bucket by canonical key
const byKey = new Map();
for (const d of all) {
  const key = canonical(d.name);
  if (!byKey.has(key)) {
    byKey.set(key, {
      name: d.name,
      class: d.class || '',
      moa: d.moa || '',
      uses: d.uses || '',
      aes: d.aes || '',
      notes: d.notes || '',
      sources: new Set(),
      candidates: { name: [], class: [], moa: [], uses: [], aes: [], notes: [] }
    });
  }
  const e = byKey.get(key);
  e.candidates.name.push(d.name || '');
  e.candidates.class.push(d.class || '');
  e.candidates.moa.push(d.moa || '');
  e.candidates.uses.push(d.uses || '');
  e.candidates.aes.push(d.aes || '');
  e.candidates.notes.push(d.notes || '');
  if (Array.isArray(d.source)) for (const s of d.source) e.sources.add(String(s).replace(/\.pdf$/i,''));
  else if (typeof d.source === 'string') e.sources.add(d.source.replace(/\.pdf$/i,''));
}

// For each bucket pick the longest non-empty candidate
function pickBest(list) {
  return list.filter(x => x && x.trim()).sort((a,b)=>b.length-a.length)[0] || '';
}
function pickName(list) {
  // Prefer single-drug name (e.g. "Furosemide") over class-form ("Loop diuretics (furosemide)")
  // Heuristic: prefer shortest that isn't trivially abbreviated; fall back to longest
  const filtered = list.filter(x=>x && x.trim());
  if (!filtered.length) return '';
  // Prefer ones without parentheses
  const noParens = filtered.filter(x=>!/[()]/.test(x));
  const pool = noParens.length ? noParens : filtered;
  pool.sort((a,b)=>a.length-b.length);
  return pool[0];
}

const merged = [];
for (const [key, e] of byKey.entries()) {
  merged.push({
    name: pickName(e.candidates.name),
    class: pickBest(e.candidates.class),
    moa: pickBest(e.candidates.moa),
    uses: pickBest(e.candidates.uses),
    aes: pickBest(e.candidates.aes),
    notes: pickBest(e.candidates.notes),
    sources: [...e.sources].sort((a,b)=>+a-+b)
  });
}

// Sort drugs alphabetically by name
merged.sort((a,b)=>a.name.localeCompare(b.name));

console.error(`Merged to ${merged.length} unique drugs`);
fs.writeFileSync(path.join(__dirname, 'drugs.json'), JSON.stringify(merged, null, 2));
console.error('Wrote drugs.json');
