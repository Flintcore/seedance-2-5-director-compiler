// Development-only exact-source comparison; never an automatic generation gate.
// Checks the supplied original utterance order and optional shot assignments.
// It does not infer a cut word, timing, offscreen voice, lip sync or coreference.
// Raw quote spans/annotations are retained by the callers' lexical utterances.
const sourceText = line => line?.text ?? line?.spoken_text;
export function canonicalShotId(value) {
  const match = typeof value === 'string' && /^(?:SH|S|镜头)\s*0*([1-9]\d*)$/u.exec(value);
  return match ? 'S' + Number(match[1]) : null;
}
const validShot = value => canonicalShotId(value) !== null;

function matchUnits(actual, units, checkShot) {
  let unitIndex = 0, offset = 0;
  for (const [index, spoken] of actual.entries()) {
    const unit = units[unitIndex];
    if (!unit || spoken.speaker !== unit.speaker || typeof spoken.text !== 'string'
      || !spoken.text.length || !unit.text.slice(offset).startsWith(spoken.text)) {
      return { matched: false, message: 'utterance ' + (index + 1) + ' differs from original line/fragment ' + (unitIndex + 1) + ' in exact text, order or speaker' };
    }
    if (checkShot && unit.shot_id !== undefined && canonicalShotId(spoken.shot_id) !== canonicalShotId(unit.shot_id)) {
      return { matched: false, message: 'utterance ' + (index + 1) + ' belongs to ' + unit.shot_id + ', observed ' + (spoken.shot_id ?? 'no shot') };
    }
    offset += spoken.text.length;
    if (offset === unit.text.length) { unitIndex++; offset = 0; }
  }
  return unitIndex === units.length && offset === 0
    ? { matched: true }
    : { matched: false, message: 'missing remainder of original line/fragment ' + (unitIndex + 1) };
}

export function compareDialogue(actual, expectedDialogue) {
  const errors = [];
  const status = { textMatches: null, shotMatches: null, shotCoverage: 'none' };
  if (expectedDialogue === undefined) return { errors, ...status };
  if (!Array.isArray(expectedDialogue)) return {
    errors: [{ code: 'DIALOGUE_BASELINE', message: 'expectedDialogue must be an array' }], ...status,
  };
  const originals = [], assigned = [];
  let assignedCount = 0;
  for (const [index, line] of expectedDialogue.entries()) {
    const fail = message => errors.push({ code: 'DIALOGUE_BASELINE', message: 'original line ' + (index + 1) + ': ' + message });
    const text = sourceText(line);
    if (!line || typeof line.speaker !== 'string' || !line.speaker.trim()
      || typeof text !== 'string' || !text.length) { fail('requires a nonempty speaker and original text/spoken_text'); continue; }
    if (line.shot_id !== undefined && !validShot(line.shot_id)) { fail('shot_id requires a numeric S1 / SH01 / 镜头1 form; semantic IDs need an explicit numeric mapping'); continue; }
    const original = { speaker: line.speaker, text };
    originals.push(original);
    if (line.fragments !== undefined) {
      if (!Array.isArray(line.fragments) || !line.fragments.length
        || line.fragments.some(fragment => !fragment || !validShot(fragment.shot_id)
          || typeof fragment.text !== 'string' || !fragment.text.length)) {
        fail('fragments requires nonempty exact text and shot_id in every fragment'); continue;
      }
      if (line.fragments.map(fragment => fragment.text).join('') !== text) {
        fail('fragments must concatenate to the unchanged original, including punctuation'); continue;
      }
      // A row shot_id retains its legacy whole-line, single-shot meaning.
      // Keep source shapes exclusive, consistent with the Director IR schema.
      if (line.shot_id !== undefined) {
        fail('use either whole-line shot_id or fragments, not both'); continue;
      }
      const pieces = [];
      for (const fragment of line.fragments) {
        const previous = pieces.at(-1);
        if (previous?.shot_id === canonicalShotId(fragment.shot_id)) previous.text += fragment.text;
        else pieces.push({ speaker: line.speaker, shot_id: canonicalShotId(fragment.shot_id), text: fragment.text });
      }
      assigned.push(...pieces);
      assignedCount++;
    } else {
      assigned.push({ ...original, ...(line.shot_id === undefined ? {} : { shot_id: line.shot_id }) });
      if (line.shot_id !== undefined) assignedCount++;
    }
  }
  status.shotCoverage = assignedCount === 0 ? 'none' : assignedCount === expectedDialogue.length ? 'all' : 'partial';
  if (errors.length) return { errors, ...status };
  const content = matchUnits(actual, originals, false);
  status.textMatches = content.matched;
  if (!content.matched) errors.push({ code: 'DIALOGUE_LOCK', message: content.message });
  if (assignedCount) {
    const placement = matchUnits(actual, assigned, true);
    status.shotMatches = placement.matched;
    if (!placement.matched) errors.push({ code: 'DIALOGUE_SHOT', message: placement.message });
  }
  return { errors, ...status };
}
