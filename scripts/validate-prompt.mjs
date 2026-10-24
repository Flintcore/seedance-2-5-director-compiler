// Shared seven-block contract implementation; installed as an independent file in each skill.
// Development only: no automatic generation gate; syntax does not verify acting or rendered video.
import { lexInlineText } from './inline-dialogue.mjs';
import { compareDialogue } from './dialogue-baseline.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROMPT_HEADINGS = ['本段目标','参考绑定','空间','环境','时间线','声音','不可出错'];
export const DIALOGUE_ORDER = ['本段目标','参考绑定','空间','声音','环境','时间线','不可出错'];
const HEADER = /^\s*【([^】]+)】\s*(.*?)\s*$/u;
const NODE = /^\s*【(\d{1,2}:\d{2}(?:\.\d+)?)-(\d{1,2}:\d{2}(?:\.\d+)?)】\s*(?:镜头([1-9]\d*)\s*)?(.*)$/u;
const ASSET_TOKEN = /@(image|video|audio)([1-9]\d*)(?![A-Za-z0-9_.\/-])/gu;
const AT_TOKEN = /@[^@\s=＝：:，。；;、【】（）(){}]*/gu;
const ASSET_RANGE = /@(image|video|audio)[1-9]\d*\s*(?:-|–|—|~|～|至)\s*@?(?:(?:image|video|audio))?[1-9]\d*/u;
const SOURCE_LOCATOR = /(?:file:\/\/|https?:\/\/|[A-Za-z]:[\\/]|(?:^|[\s：｜|=])\.{1,2}[\\/]|(?:^|[\s：｜|=])[^\r\n：｜|=]*?\.(?:png|jpe?g|webp|gif|bmp|tiff?|heic|mp4|mov|mkv|avi|webm|mp3|wav|m4a|flac|aac)(?=$|[\s，。；;｜|]))/imu;
const LEGACY = /风格|素材绑定|全局约束|本段戏剧任务|本段情绪总控|通用约束|头锁|收尾约束|自检|验收/u;
function normalize(s) {
  const text=String(s).replace(/^\uFEFF/u,'').replace(/\r\n?/g,'\n').trim();
  const fenced=/^(\x60{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1$/u.exec(text);
  return fenced ? fenced[2].trim() : text;
}
export function parseTime(v) {
  const [m,s]=v.split(':').map(Number);
  return Number.isFinite(m)&&Number.isFinite(s)&&s<60 ? m*60+s : null;
}
function tokens(s) { return [...s.matchAll(ASSET_TOKEN)].map(m=>({token:m[0],type:m[1],number:Number(m[2]),index:m.index})); }
function scanPrompt(text,options) {
  const lines=text.split('\n'), structural=lexInlineText(text,options).structuralText.split('\n');
  const sections=[],shots=[],malformedShots=[];
  for (const [i,line] of structural.entries()) {
    const node=NODE.exec(line);
    if (node) {
      const raw=NODE.exec(lines[i]);
      shots.push({number:node[3]?Number(node[3]):null,start:parseTime(node[1]),end:parseTime(node[2]),line:i+1,title:node[3]?raw[4]:'',inlineBody:node[3]?'':raw[4]});
    } else if (/^\s*(?:镜头\s*\d|【\s*(?:镜头\d|\d+:\d))/u.test(line)) malformedShots.push(i+1);
    else { const h=HEADER.exec(line);if(h) sections.push({name:h[1],inlineBody:HEADER.exec(lines[i])[2],line:i+1}); }
  }
  const boundaries=[...sections,...shots,...malformedShots.map(line=>({line}))].sort((a,b)=>a.line-b.line);
  const body=item=>{
    const end=(sections.includes(item)?sections:boundaries).find(x=>x.line>item.line)?.line??lines.length+1;
    return [item.inlineBody??'',...lines.slice(item.line,end-1)].join('\n').trim();
  };
  return {lines,sections,shots,malformedShots,boundaries,body};
}

function assetContract(text, scan, options, errors) {
  const binding = scan.sections.find((section) => section.name === "参考绑定");
  const bindingText = binding ? scan.body(binding) : "";
  const occurrences = tokens(text), bound = tokens(bindingText);
  const unique = [...new Set(occurrences.map((item) => item.token))];
  for (const match of text.matchAll(AT_TOKEN)) {
    // A Chinese description can follow a token without whitespace.
    if (!/^@(image|video|audio)[1-9]\d*(?![A-Za-z0-9_.\/-])/u.test(match[0])) errors.push({ code: "ASSET_TOKEN_FORMAT", message: "non-canonical @ token: " + match[0] });
  }
  if (ASSET_RANGE.test(bindingText)) errors.push({ code: "ASSET_RANGE", message: "list each unique asset separately, not as a range" });
  if (SOURCE_LOCATOR.test(text)) errors.push({ code: "ASSET_SOURCE_LOCATOR", message: "formal prompts exclude asset paths, URLs, and filenames" });
  const end = binding ? (scan.boundaries.find((item) => item.line > binding.line)?.line ?? scan.lines.length + 1) : 0;
  for (const item of occurrences) {
    const line = text.slice(0, item.index).split("\n").length;
    if (!binding || line < binding.line || line >= end) errors.push({ code: "ASSET_REFERENCE_LOCATION", message: item.token + " belongs only inside 【参考绑定】" });
  }
  for (const token of unique) if (occurrences.filter((item) => item.token === token).length > 1) errors.push({ code: "ASSET_DUPLICATE_REFERENCE", message: token + " must occur exactly once" });
  if (!bound.length && binding && !/^无外部参考素材[。.]?$/u.test(bindingText)) errors.push({ code: "ASSET_EMPTY_DECLARATION", message: "without references, 【参考绑定】 contains only 无外部参考素材; shared setting facts belong in 【空间】和【环境】" });
  if (bound.length && bindingText.includes("无外部参考素材")) errors.push({ code: "ASSET_EMPTY_CONFLICT", message: "no-reference declaration conflicts with bound assets" });
  if (unique.length > 50) errors.push({ code: "ASSET_LIMIT", message: "unique asset count " + unique.length + " exceeds 50" });
  if (options.preserveAssetNumbering !== true) {
    for (const type of ["image", "video", "audio"]) {
      if (bound.filter((item) => item.type === type).some((item, index) => item.number !== index + 1)) errors.push({ code: "ASSET_NUMBERING", message: "new @" + type + " placeholders start at 1 and are contiguous in appearance order" });
    }
  }
  // Prior tokens are optional evidence. Final text alone cannot establish the
  // former source-to-token mapping; even this evidence checks IDs, not identity.
  if (options.existingAssetTokens !== undefined) {
    const existing = options.existingAssetTokens;
    if (options.preserveAssetNumbering !== true || !Array.isArray(existing)
      || existing.some((item) => typeof item !== "string" || !/^@(image|video|audio)[1-9]\d*$/u.test(item))
      || new Set(existing).size !== existing.length) {
      errors.push({ code: "ASSET_BASELINE", message: "existingAssetTokens requires preserved numbering and a unique canonical token array" });
    } else {
      const retained = bound.filter((item) => existing.includes(item.token)).map((item) => item.token);
      if (JSON.stringify(retained) !== JSON.stringify(existing)) errors.push({ code: "ASSET_EXISTING_ORDER", message: "existing tokens must remain present in original order" });
      for (const type of ["image", "video", "audio"]) {
        const highest = Math.max(0, ...existing.filter((item) => item.startsWith("@" + type)).map((item) => Number(item.slice(type.length + 1))));
        const added = bound.filter((item) => item.type === type && !existing.includes(item.token));
        if (added.some((item, index) => item.number !== highest + index + 1)) errors.push({ code: "ASSET_APPEND_NUMBERING", message: "new @" + type + " tokens continue after the highest existing ID without filling gaps" });
      }
    }
  }
  for (const [type, limit] of [['image',30],['video',10],['audio',10]]) {
    if (bound.filter(x=>x.type===type).length>limit) errors.push({code:'ASSET_TYPE_LIMIT',message:type+' exceeds '+limit});
  }
  return { assets: unique.length, assetTokens: unique };
}


export function validatePrompt(input,options={}) {
  const text=normalize(input), scan=scanPrompt(text,options), errors=[];
  const add=(code,message)=>errors.push({code,message});
  for(const section of scan.sections) {
    section.body=scan.body(section);
    if(!PROMPT_HEADINGS.includes(section.name)) add(LEGACY.test(section.name)?'LEGACY_SECTION':'UNEXPECTED_SECTION','unsupported 【'+section.name+'】');
    if(!section.body) add('SECTION_EMPTY','empty 【'+section.name+'】');
    if(/自检|自查|验收/u.test(section.name))add('SELF_CHECK_HEADING','self-check is outside prompt');
    if(section.name!=='时间线'&&lexInlineText(section.body,options).dialogue.length) add('DIALOGUE_REFERENCE_LOCATION','actual dialogue belongs in its audible timeline node');
  }
  for(const name of PROMPT_HEADINGS) {
    const n=scan.sections.filter(x=>x.name===name).length;
    if(!n)add('SECTION_MISSING','missing 【'+name+'】');
    if(n>1)add('SECTION_DUPLICATE','duplicate 【'+name+'】');
  }
  const ordered=scan.sections.map(x=>x.name);
  if(![PROMPT_HEADINGS,DIALOGUE_ORDER].some(order=>JSON.stringify(order)===JSON.stringify(ordered)))add('SECTION_ORDER','use default seven blocks or V3 sound-after-space order');
  if(scan.sections[0]?.line!==1||scan.sections[0]?.name!=='本段目标')add('PROMPT_PREFIX','prompt begins with 【本段目标】');
  for(const line of scan.malformedShots)add('SHOT_HEADING_FORMAT','line '+line+': use 【0:00-0:04】镜头1 or one-take event node');
  if(!scan.shots.length)add('SHOT_MISSING','timeline needs at least one shot/event node');
  const timeline=scan.sections.find(x=>x.name==='时间线');
  const timelineEnd=scan.sections.find(x=>x.line>(timeline?.line??Infinity))?.line??Infinity;
  const numbered=scan.shots.filter(x=>x.number!==null), continuous=numbered.length===0;
  if(numbered.length&&numbered.length!==scan.shots.length)add('SHOT_NODE_MIX','do not mix shot numbers and no-cut event nodes');
  if(continuous&&scan.shots.length&&!/单一连续镜头|同一个连续镜头|一镜到底/u.test(text))add('CONTINUOUS_SCOPE','unnumbered nodes need an explicit continuous-take scope');
  for(const [i,shot] of scan.shots.entries()) {
    if(!timeline||shot.line<=timeline.line||shot.line>=timelineEnd)add('SHOT_LOCATION','shot/event node belongs inside 时间线');
    if(!continuous&&shot.number!==i+1)add('SHOT_NUMBERING','shot numbers start at 1 and stay contiguous');
    if(shot.start===null||shot.end===null||shot.end<=shot.start)add('SHOT_TIME_FORMAT','invalid time at line '+shot.line);
    const prev=scan.shots[i-1];
    if(prev&&shot.start!==null&&prev.end!==null&&Math.abs(shot.start-prev.end)>1e-9)add(shot.start<prev.end?'SHOT_TIME_OVERLAP':'SHOT_TIME_GAP','adjacent budgets must meet');
    if(i===0&&shot.start!==0)add('SHOT_START','first budget starts at 0:00');
    let body=scan.body(shot);
    // An explicit cut declaration can stand between paragraphs; it is still the preceding shot's interface.
    body=body.replace(/\n\s*\n(?=(?:在[^\n]*?同时，)?(?:硬切|切到|匹配切|声音桥))/gu,'\n');
    const lex=lexInlineText(body,options);
    errors.push(...lex.errors);
    if(!body||lex.structuralText.split(/\n\s*\n/u).length>1)add('SHOT_PARAGRAPH','one continuous prose paragraph per shot/event');
    if(/^\s*台词\s*[:：]/mu.test(lex.structuralText))add('LEGACY_DIALOGUE_LINE','speech belongs inline at the moment it is heard');
    if(/[{}]/u.test(lex.structuralText))add('LEGACY_DIALOGUE_BRACES','use double-quoted dialogue');
    if(/^\s*(?:①|②|③|机位[:：]|景别[:：]|焦段[:：]|表演[:：])/mu.test(lex.structuralText))add('LEGACY_ROW','write continuous scene prose rather than separate technical fields');
    shot.body=body;shot.structuralBody=lex.structuralText;
    shot.dialogue=lex.dialogue.map(u=>({...u,shot_id:'S'+(continuous?i+1:shot.number)}));
    shot.utterances=shot.dialogue;
  }
  const duration=scan.shots.at(-1)?.end??null;
  if(duration!==null&&(duration<4||duration>30))add('DURATION_RANGE','segment duration must be 4–30 seconds');
  const structural=lexInlineText(text,options).structuralText;
  if(/[{}]/u.test(structural))add('LEGACY_DIALOGUE_BRACES','braces are not the final dialogue/binding syntax');
  if(/^\s*[─*]\s*(?:素材绑定|参考绑定|角色外观|场景外观)[:：]/mu.test(structural))add('LEGACY_ROW','retired shared-field layout');
  const asset=assetContract(text,scan,options,errors);
  const mode=options.generationMode??null;
  if(mode&&!['reference','first_last','first_frame','text','edit','extend'].includes(mode))add('GENERATION_MODE','unknown explicit generationMode');
  const refs=tokens(scan.sections.find(x=>x.name==='参考绑定')?.body??'');
  if(mode==='text'&&refs.length)add('MODE_ASSETS','text mode has no external input');
  if(mode==='first_last'||mode==='first_frame') {
    const needed=mode==='first_last'?2:1;
    if(refs.length!==needed||refs.some(x=>x.type!=='image'))add('MODE_ASSETS','frame mode needs '+needed+' frame image input(s)');
    if(/不作为首帧|不把[^。\n]*用作首帧|仅作参考/u.test(scan.sections.find(x=>x.name==='参考绑定')?.body??''))add('MODE_FRAME_CONFLICT','actual frame slots conflict with reference-only declaration');
  }
  if((mode==='edit'||mode==='extend')&&!refs.some(x=>x.type==='video'))add('MODE_SOURCE','edit/extend needs an actual source video');
  const dialogue=scan.shots.flatMap(x=>x.dialogue);
  const dialogueCheck=compareDialogue(dialogue,options.expectedDialogue);
  errors.push(...dialogueCheck.errors);
  return {ok:!errors.length,errors,facts:{duration,...asset,headings:ordered,sections:scan.sections,shots:scan.shots,continuous,mode,dialogue,dialogueCheck}};
}
async function main() {
  const args=process.argv.slice(2),json=args.includes('--json'),preserveAssetNumbering=args.includes('--preserve-asset-numbering');
  const files=args.filter(x=>!['--json','--preserve-asset-numbering'].includes(x));
  if(files.length>1||files.some(x=>x.startsWith('--')))throw Error('Usage: validate-prompt.mjs [--json] [--preserve-asset-numbering] [file]');
  let input;
  if(files.length)input=await readFile(path.resolve(files[0]),'utf8');
  else {const chunks=[];for await(const x of process.stdin)chunks.push(x);input=Buffer.concat(chunks).toString('utf8');}
  const r=validatePrompt(input,{preserveAssetNumbering});
  if(json)process.stdout.write(JSON.stringify(r,null,2)+'\n');
  else process.stdout.write(r.ok?'valid seven-block structure (not generated-video validation)\n':r.errors.map(x=>x.code+': '+x.message).join('\n')+'\n');
  if(!r.ok)process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{process.stderr.write(String(e.stack??e)+'\n');process.exitCode=1;});
