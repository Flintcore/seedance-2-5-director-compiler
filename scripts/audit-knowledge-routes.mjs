// Maintenance graph audit. Reachability is not evidence that a runtime actually read a chapter.
import { readFileSync,readdirSync,existsSync,statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DEFAULT_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
export function auditKnowledgeRoutes(root=DEFAULT_ROOT){
 root=path.resolve(root);const compiler=existsSync(path.join(root,'references/cinema'));
 const local=file=>path.relative(root,file).replaceAll('\\','/');
 const edges=new Map(),broken=[],seen=new Set();
 const queue=[path.join(root,'SKILL.md')];
 const strict=file=>local(file)==='SKILL.md'||local(file).startsWith('modules/')||local(file).startsWith('references/writing/')||local(file).startsWith('references/model/');
 while(queue.length){
  const file=queue.shift();if(seen.has(file))continue;seen.add(file);
  const text=readFileSync(file,'utf8');
  const markdown=[...text.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/gu)].map(m=>({raw:m[1],required:true}));
  const codes=[...text.matchAll(/`([^`\n]+\.md(?:#[^`\n]*)?)`/gu)].map(m=>({raw:m[1],required:false}));
  const targets=[];
  for(const {raw,required} of [...markdown,...codes]){
   if(/^(?:[a-z][a-z0-9+.-]*:|#)/iu.test(raw)||/[<>{}*]/u.test(raw))continue;
   let target;try{target=decodeURIComponent(raw.split(/[?#]/u)[0]);}catch{if(required&&strict(file))broken.push({from:local(file),to:raw});continue;}
   if(!target.endsWith('.md'))continue;
   const choices=[path.resolve(path.dirname(file),target),path.resolve(root,target)];
   const resolved=choices.find(p=>!path.relative(root,p).startsWith('..')&&existsSync(p)&&statSync(p).isFile());
   if(!resolved){if(required&&strict(file))broken.push({from:local(file),to:raw});continue;}
   // Generated bundles and frozen history are not an alternate runtime authority.
   if(/^(?:baseline\/|modules\/bundles\/)/u.test(local(resolved)))continue;
   targets.push(resolved);queue.push(resolved);
  }
  edges.set(file,[...new Set(targets)]);
 }
 const refs=path.join(root,'references');
 const cinema=compiler?walk(path.join(refs,'cinema')).filter(f=>f.endsWith('.md')&&path.basename(f)!=='INDEX.md'):
  [...readdirSync(refs).filter(f=>f.endsWith('.md')&&f!=='INDEX.md').map(f=>path.join(refs,f)),...walk(path.join(refs,'导演体系')).filter(f=>f.endsWith('.md')&&path.basename(f)!=='INDEX.md')];
 const masters=walk(path.join(refs,'masters')).filter(f=>f.endsWith('.md')&&!/^INDEX|^README/u.test(path.basename(f)));
 const writing=walk(path.join(refs,'writing')).filter(f=>f.endsWith('.md'));
 const required=[...cinema,...masters,...writing,...['prompt-writing-sop.md','prompt-template.md','knowledge-routing.md'].map(f=>path.join(root,'modules',f))];
 const unreachable=required.filter(f=>!seen.has(f)).map(local);
 const entry=readFileSync(path.join(root,'SKILL.md'),'utf8');
 const mandatoryLinked=entry.includes('modules/prompt-writing-sop.md');
 return {ok:!broken.length&&!unreachable.length&&mandatoryLinked,mandatoryLinked,broken,unreachable,
  facts:{cinemaBodies:cinema.length,masterBodies:masters.length,writingResources:writing.length,reachableMarkdown:seen.size},
  edges:Object.fromEntries([...edges].map(([k,v])=>[local(k),v.map(local)]))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=auditKnowledgeRoutes();const {edges,...summary}=r;
 console.log(process.argv.includes('--json')?JSON.stringify(summary,null,2):JSON.stringify(summary));
 if(!r.ok)process.exitCode=1;
}
