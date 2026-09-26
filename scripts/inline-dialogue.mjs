// Development-only lexical support for inline speech. Not a performance judge.
// Quote/stage spans are exact UTF-16 source offsets; spokenOffset counts Unicode
// code points. Speaker extraction is a bounded cue heuristic, not coreference.
const SPEECH_END = /(?:说|问|追问|反问|回答|答道|喊|喊道|低语|低声道|说道|问道|回应|叫道|念道|读道|读出|念出|唱道|唱|哼唱|嘀咕|提醒|命令|请求|解释|宣布|补充|呼喊|呢喃|发出)(?:着)?\s*[:：]?\s*$/u;
const VOICE_END = /(?:旁白|画外音|声音|叫声|拟声词)(?:传来|响起)?\s*[:：]?\s*$/u;
const ACTION_START = /(?:的(?:画外音|声音|叫声)|从|于\d|才|终于|在|下颌|眉|眼|嘴|肩|手|仍|先|正|已经|刚|看着|看向|望着|望向|迎着|盯着|抬眼|抬头|低头|转头|转向|垂眼|轻吸|吸气|呼吸|停顿|停一|压低|提高|放低|放轻|轻声|低声|平静|平稳|缓慢|慢慢|急促|轻轻|冷冷|笑着|笑了|皱眉|开口|接着|继续|随后|用|以|将|把|伸手|收住|握着|按住|向|对着|对|说|问|追问|反问|回答|答道|喊|低语|回应|叫道|念道|读道|读出|念出|唱道|唱|哼唱|嘀咕|提醒|命令|请求|解释|宣布|补充|呼喊|呢喃|发出)/u;
function speechCue(text, quoteStart, previousEnd, names) {
  const raw = text.slice(Math.max(previousEnd, quoteStart - 800), quoteStart);
  const prefix = raw.slice(Math.max(raw.lastIndexOf('。'), raw.lastIndexOf('！'), raw.lastIndexOf('？'), raw.lastIndexOf(';'), raw.lastIndexOf('；'), raw.lastIndexOf('\n')) + 1).trim();
  if (!SPEECH_END.test(prefix) && !VOICE_END.test(prefix)) return null;
  // Explicit source names, when supplied by a source lock, avoid guessing them.
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const matching = sorted.map(name => ({ name, index: prefix.lastIndexOf(name) })).filter(item => item.index >= 0);
  // Prefer a name at clause start; mentions of an interlocutor are not speakers.
  const direct = matching.filter(item => item.index === 0 || /[，,；;]\s*$/u.test(prefix.slice(0, item.index))).sort((a, b) => b.index - a.index)[0];
  if (direct) return { speaker: direct.name, speakerResolution: 'supplied-name-cue', cue: prefix };
  // A limited positional modifier can precede an explicitly supplied source;
  // do not select arbitrary last-mentioned interlocutors from a whole clause.
  const located = matching.find(item => /^(?:桌对面|门外|门内|(?:画外|画内)(?:东侧|西侧|南侧|北侧)?|镜头外|镜头内|左侧|右侧|身后)的$/u.test(prefix.slice(0, item.index)));
  if (located) return { speaker: located.name, speakerResolution: 'supplied-name-cue', cue: prefix };
  if (/^(?:画外)?旁白/u.test(prefix)) return { speaker: '旁白', speakerResolution: 'explicit-narration', cue: prefix };
  const source = /(?:传来|响起)([^，,。；;：:]{1,24}?)(?:的)?(?:画外音|声音|叫声)/u.exec(prefix);
  if (source) return { speaker: source[1].replace(/的$/u, ''), speakerResolution: 'surface-cue', cue: prefix };
  let subject = prefix.replace(/^(?:与此同时|这时|此时|随后|接着|然后)[，,]?\s*/u, '');
  const action = ACTION_START.exec(subject);
  if (action && action.index > 0) subject = subject.slice(0, action.index);
  else if (action?.index === 0) subject = '';
  subject = subject.split(/[，,：:（(]/u)[0].trim();
  if (subject && subject.length <= 24 && !/[\d]|mm/u.test(subject)) return { speaker: subject, speakerResolution: 'surface-cue', cue: prefix };
  // A cue remains observable even when natural-language subject resolution needs
  // human interpretation. Do not silently lose a spoken utterance.
  return { speaker: null, speakerResolution: 'unresolved', cue: prefix };
}
export function lexInlineText(text, { speakerNames = [], expectedDialogue = [] } = {}) {
  text = String(text);
  const baseline = Array.isArray(expectedDialogue) ? expectedDialogue.filter(item => item && typeof item === 'object') : [];
  const names = [...speakerNames, ...baseline.map(item => item.speaker)].filter(name => typeof name === 'string' && name.length);
  // Explicit fragment locks also preserve literal delimiters in source text.
  // Do not invent fragment boundaries by guessing where a quote was cut.
  const sourceLiterals = baseline.flatMap(item => [item.text ?? item.spoken_text,
    ...(Array.isArray(item.fragments) ? item.fragments.map(fragment => fragment?.text) : [])]);
  const mask = text.split(''), quotes = [], dialogue = [], errors = [];
  let i = 0, previousEnd = 0;
  const erase = (start, end) => { for (let k = start; k < end; k++) if (text[k] !== '\n' && text[k] !== '\r') mask[k] = ' '; };
  while (i < text.length) {
    const open = text[i];
    if (open === '”') { errors.push({ code: 'QUOTE_BALANCE', message: 'unexpected closing double quote', index: i }); i++; continue; }
    if (open !== '“' && open !== '"') { i++; continue; }
    const start = i, close = open === '“' ? '”' : '"';
    const cue = speechCue(text, start, previousEnd, names);
    // If the observed quote exactly contains a source-locked original with its
    // own delimiters, treat those original characters as literal spoken text.
    // This branch never rewrites, completes, or substitutes the supplied source.
    const lockedLiteral = cue && sourceLiterals
      .find(value => typeof value === 'string' && /[“”"【】]/u.test(value)
        && text.slice(start + 1, start + 1 + value.length) === value
        && text[start + 1 + value.length] === close);
    if (lockedLiteral) {
      i = start + lockedLiteral.length + 2;
      const entry = { start, end: i, raw: text.slice(start, i), text: lockedLiteral,
        spoken_text: lockedLiteral, annotations: [], literalSourceDelimiters: true, ...cue };
      quotes.push(entry); dialogue.push(entry); erase(start, i); previousEnd = i;
      continue;
    }
    const candidateEnd = text.indexOf(close, start + 1);
    const candidate = candidateEnd < 0 ? null : text.slice(start + 1, candidateEnd);
    // A source lock can distinguish literal bracket characters being read aloud
    // from newly inserted nonspoken directions. Never drop locked original text.
    const literalBrackets = cue && candidate !== null && /[【】]/u.test(candidate)
      && sourceLiterals.some(value => value === candidate);
    let spoken = '', annotations = [], stage = null, ended = false;
    i++;
    while (i < text.length) {
      const char = text[i];
      if (char === close && stage === null) { ended = true; i++; break; }
      if (char === '“' || (char === '”' && close !== '”')) errors.push({ code: 'QUOTE_BALANCE', message: 'nested or mismatched double quote; check the source baseline and boundaries without rewriting locked words', index: i });
      if (char === '【' && !literalBrackets) {
        if (stage !== null) errors.push({ code: 'STAGE_BALANCE', message: 'nested stage annotation', index: i });
        else stage = { start: i, text: '', spokenOffset: Array.from(spoken).length };
      } else if (char === '】' && !literalBrackets) {
        if (stage === null) errors.push({ code: 'STAGE_BALANCE', message: 'unexpected closing stage bracket', index: i });
        else { annotations.push({ ...stage, end: i + 1 }); stage = null; }
      } else if (stage !== null) {
        if (char === close) errors.push({ code: 'STAGE_BALANCE', message: 'unclosed stage annotation before closing quote', index: stage.start });
        stage.text += char;
      } else spoken += char;
      i++;
    }
    if (stage !== null) errors.push({ code: 'STAGE_BALANCE', message: 'unclosed stage annotation', index: stage.start });
    if (!ended) errors.push({ code: 'QUOTE_BALANCE', message: 'unclosed double quote', index: start });
    const entry = { start, end: i, raw: text.slice(start, i), text: spoken, spoken_text: spoken, annotations, ...(literalBrackets ? { literalBrackets: true } : {}), ...(cue ?? {}) };
    quotes.push(entry);
    if (cue) {
      if (!spoken.trim()) errors.push({ code: 'DIALOGUE_EMPTY', message: 'spoken utterance is empty', index: start });
      dialogue.push(entry);
    }
    erase(start, i);
    previousEnd = i;
  }
  return { structuralText: mask.join(''), quotes, dialogue, errors };
}
