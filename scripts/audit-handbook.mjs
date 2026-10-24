// Maintenance-only source preservation audit, not a prompt-quality gate.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SOURCE_SHA256='e3791f4fde23db3b23bbbc4c6dc94a6a4fc01abed0b40a6d39823fedbd3d7191';
const FILES=['00-independent.md','01-overview.md','02-reference-space-timeline.md','03-camera-editing.md','04-variants.md','05-sound-dialogue-diagnosis.md','06-director-thinking.md','07-author-context.md'];
const MARKERS=['# Seedance 2.5 提示词完整手册 · ① 总纲','# 手册 ②','# 手册 ③','# 手册 ④','# 手册 ⑤','# 手册 ⑥','以上是所有的内容'];
const hash=x=>createHash('sha256').update(x).digest('hex');
export function readingEdition(text,id){
 if(id===0){
  text=text.replace(/\\\n/gu,'\n').replace(/\\([\\`*_{}\[\]()#+.!|>\-])/gu,'$1');
  text=text.replace('总的元模板：#','总的元模板：\n\n#');
 }
 return text.replace(/&#(x[0-9a-f]+|\d+);/giu,(_,value)=>String.fromCodePoint(value.toLowerCase().startsWith('x')?parseInt(value.slice(1),16):parseInt(value,10)))
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/gu,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'})[name]);
}
function chapters(text){let fenced=false;const out=[];text.split(/\r?\n/u).forEach((line,i)=>{
 if(line.startsWith('```')){fenced=!fenced;return;}
 if(!fenced&&/^#{1,6} /u.test(line))out.push({heading:line,line:i+1});
});return out;}
function blocks(text){return [...text.matchAll(/^```[^\n]*\n([\s\S]*?)^```[^\n]*$/gmu)].map(m=>m[1]);}
export function auditHandbook(root=ROOT){
 const base=path.join(root,'references/writing/handbook'),errors=[],documents=[];
 const check=(pass,message)=>{if(!pass)errors.push(message);};
 if(!existsSync(path.join(base,'manifest.json')))return {ok:false,errors:['missing manifest'],facts:{}};
 const manifest=JSON.parse(readFileSync(path.join(base,'manifest.json'),'utf8'));
 if(!existsSync(path.join(base,'source-verbatim.md')))return {ok:false,errors:['missing source-verbatim.md'],facts:{}};
 const raw=readFileSync(path.join(base,'source-verbatim.md')),source=raw.toString('utf8');
 check(hash(raw)===SOURCE_SHA256,'source bytes differ from the received user message');
 check(manifest.rawSha256===SOURCE_SHA256,'manifest source hash differs from pinned source');
 check(raw.equals(Buffer.from(source,'utf8')),'source UTF-8 roundtrip changed bytes');
 const chars=Array.from(source);
 check(chars.length===32816&&raw.length===83604,'source length changed');
 check(manifest.rawCharacters===chars.length&&manifest.rawUtf8Bytes===raw.length,'manifest source size mismatch');
 check(JSON.stringify(manifest.documents?.map(d=>d.file))===JSON.stringify(FILES),'document list is not the complete source partition');
 const starts=[0,...MARKERS.map(m=>{const at=source.indexOf(m);check(at>=0,`missing source marker ${m}`);return Array.from(source.slice(0,Math.max(0,at))).length;}),chars.length];
 let reconstructed='',totalBlocks=0;
 for(let i=0;i<FILES.length;i++){
  const item=manifest.documents?.[i];if(!item){errors.push(`missing manifest document ${i}`);continue;}
  const fragment=chars.slice(starts[i],starts[i+1]).join(''),expected=readingEdition(fragment,i);
  reconstructed+=fragment;
  check(item.id===i&&item.sourceStart===starts[i]&&item.sourceEnd===starts[i+1],`source span mismatch: ${FILES[i]}`);
  check(item.sourceStartByte===Buffer.byteLength(chars.slice(0,starts[i]).join(''))&&item.sourceEndByte===Buffer.byteLength(chars.slice(0,starts[i+1]).join('')),`byte span mismatch: ${FILES[i]}`);
  check(item.sourceSliceSha256===hash(fragment),`source fragment hash mismatch: ${FILES[i]}`);
  const filename=path.join(base,FILES[i]);if(!existsSync(filename)){errors.push(`missing chapter: ${FILES[i]}`);continue;}
  const actual=readFileSync(filename,'utf8');
  check(actual===expected,`reading edition has omitted or changed content: ${FILES[i]}`);
  check(item.readingSha256===hash(actual),`reading hash mismatch: ${FILES[i]}`);
  const originalBlocks=blocks(expected),actualBlocks=blocks(actual);
  check(JSON.stringify(actualBlocks)===JSON.stringify(originalBlocks),`template/example code changed: ${FILES[i]}`);
  check(item.codeBlocks===actualBlocks.length,`code-block inventory mismatch: ${FILES[i]}`);
  check(JSON.stringify(item.sections)===JSON.stringify(chapters(actual)),`section inventory mismatch: ${FILES[i]}`);
  totalBlocks+=actualBlocks.length;documents.push({file:FILES[i],characters:Array.from(actual).length,codeBlocks:actualBlocks.length,sections:chapters(actual).length});
 }
 check(reconstructed===source,'source partition is not complete and ordered');
 check(totalBlocks===44&&manifest.codeBlocks===44,'all 44 source template/example blocks must remain');
 const variantPath=path.join(base,FILES[4]);
 const variants=existsSync(variantPath)?[...readFileSync(variantPath,'utf8').matchAll(/^### V(\d+)\s/gmu)].map(m=>Number(m[1])):[];
 check(JSON.stringify(variants)===JSON.stringify(Array.from({length:18},(_,i)=>i+1)),'V1-V18 source variants are incomplete');
 return {ok:errors.length===0,errors,facts:{sourceSha256:hash(raw),sourceBytes:raw.length,sourceCharacters:chars.length,sourceDocuments:documents.length,codeBlocks:totalBlocks,variants:variants.length,sections:documents.reduce((sum,d)=>sum+d.sections,0)},documents};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=auditHandbook();console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1;
}
