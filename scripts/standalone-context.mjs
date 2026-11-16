// Maintenance-only audit of explicit context dependencies, NOT a generation gate.
// It cannot infer upload state, read image labels, prove geometry, or judge all prose.
import {lexInlineText} from './inline-dialogue.mjs';

const BLOCK=/^【(本段目标|参考绑定|空间|环境|时间线|声音|不可出错)】/gmu;
const ASSET=/@(image|video|audio)[1-9]\d*/gu;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function auditStandaloneContext(text,options={}){
  if(options.scope==='design')return {ok:true,skipped:true,coverage:'final-prompt-only',findings:[]};
  text=String(text);const mask=text.split('');
  // Mask only observed spoken dialogue, not every quoted label or instruction.
  for(const q of lexInlineText(text,options).dialogue)
    for(let i=q.start;i<q.end;i++)if(mask[i]!=='\n'&&mask[i]!=='\r')mask[i]=' ';
  const narration=mask.join('');
  const headings=[...narration.matchAll(BLOCK)].map(m=>({index:m.index,name:m[1]}));
  const findings=[];
  const add=(code,index,excerpt)=>findings.push({code,line:text.slice(0,index).split('\n').length,
    section:headings.filter(h=>h.index<=index).at(-1)?.name??'outside',excerpt});
  const history=[
    /(?:上|前|下|后)(?:一)?(?:个)?(?:生成)?(?:段|片段|segment)/giu,
    /(?:保持|沿用|按照|按|延续|同)(?:此前|之前|原来|前面|先前)(?:的)?(?:位置|状态|造型|声音|声线|音色|设定|光影|构图)/gu,
    /(?:同|沿用|保持)(?:原有|原)(?:声线|音色)/gu,
  ];
  for(const pattern of history)for(const m of narration.matchAll(pattern))add('UNSUBMITTED_HISTORY',m.index,m[0]);
  // A casual token elsewhere is not a binding; actual input authority is explicit.
  const bindingStart=headings.findIndex(h=>h.name==='参考绑定');
  const bindingText=bindingStart<0?'':narration.slice(headings[bindingStart].index,headings[bindingStart+1]?.index??narration.length);
  const tokens=new Set([...bindingText.matchAll(ASSET)].map(m=>m[0]));
  const supplied=new Set(options.suppliedAssetTokens??[]);
  if(options.suppliedAssetTokens!==undefined)
    for(const m of narration.matchAll(ASSET))if(!supplied.has(m[0]))add('ASSET_NOT_SUBMITTED',m.index,m[0]);
  const layout=new Set((options.layoutAssetTokens??[]).filter(t=>tokens.has(t)&&supplied.has(t)));
  if(!layout.size)
    for(const m of narration.matchAll(/(?:按|按照|依|依照)(?:图示|示意图|草图)(?:位置|站位|布局)?/gu))add('UNSUBMITTED_DIAGRAM',m.index,m[0]);
  // Symbols come from the actual design baseline; generic identifiers are only hints.
  const symbols=new Map((options.internalSymbols??[]).map(s=>[s.id,s]));
  for(const m of narration.matchAll(/\b(?:(?:LOOK|SS|SH|BEAT)[-_]?\d+|[A-Z]\d+)\b/gu))
    if(!symbols.has(m[0]))symbols.set(m[0],{id:m[0]});
  for(const symbol of symbols.values()){
    if(!symbol.id)continue;
    const pattern=new RegExp(`(?<![A-Za-z0-9_])${escape(symbol.id)}(?![A-Za-z0-9_])`,'gu');
    const hits=[...narration.matchAll(pattern)];if(!hits.length)continue;
    // A visible label needs evidence from an actually supplied + bound asset,
    // or an explicit physical definition in this prompt (not an internal memory).
    const visibleAsset=symbol.visibleInAsset===true&&tokens.has(symbol.sourceAsset)&&supplied.has(symbol.sourceAsset);
    const declared=typeof symbol.definition==='string'&&symbol.definition.trim().length>0&&narration.includes(symbol.definition);
    const physicalLabel=new RegExp(`(?:贴有|标有|标着|印有|写着)[^。\n]{0,18}[“\"']?${escape(symbol.id)}[”\"']?(?:号)?(?:标牌|标签|字样)`).test(narration);
    if(!visibleAsset&&!declared&&!physicalLabel)for(const hit of hits)add('UNRESOLVED_SYMBOL',hit.index,symbol.id);
  }
  return {ok:findings.length===0,skipped:false,coverage:'explicit-dependencies-only',findings};
}
