import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validatePrompt, PROMPT_HEADINGS, DIALOGUE_ORDER } from '../scripts/validate-prompt.mjs';

// Minimal maintenance fixture, not a generated creative trial or a model-quality claim.
const fixture=`【本段目标】
8秒，两镜。陈默想让林岚等候，林岚暂不答应。自然数字摄影，稳定观察。
【参考绑定】
@image1 = 陈默外观参考，仅继承人物；全能参考，不作为首帧或尾帧。
@video1 = 运镜参考，只取路线。
@audio1 = 陈默音色，原文按时间线。
【空间】
从门向桌看：桌在北，陈默站桌西，林岚站桌东。
【环境】
窗光照着桌面，安静房间。
【时间线】
【0:00-0:03.5】镜头1 中景。
50mm中景，机位在桌南侧眼高平视固定。陈默站画左看林岚，陈默说：“门一直关着，”陈默把手留在桌沿。硬切到镜头2，声音不断。
【0:03.5-0:08】镜头2 反应近景。
85mm近景，机位在林岚右前1/4眼高平视。林岚保持桌东站位；陈默从画外继续说：“直到钟响。”林岚听完仍看向桌西的陈默。
【声音】
无BGM，通风声持续。陈默声线平稳，前后是同一次发声，听者不接说。
【不可出错】
原句与说话人保持；两人位置按世界基准接续；无字幕。
`;
const source=[{speaker:'陈默',text:'门一直关着，直到钟响。',fragments:[{shot_id:'S1',text:'门一直关着，'},{shot_id:'S2',text:'直到钟响。'}]}];
const good=(s=fixture,o={})=>{const r=validatePrompt(s,o);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};
const bad=(s,code,o={})=>{const r=validatePrompt(s,o);assert.equal(r.ok,false);assert.ok(r.errors.some(x=>x.code===code),JSON.stringify(r.errors));};
function blocks(s) { return Object.fromEntries([...s.matchAll(/^【(本段目标|参考绑定|空间|环境|时间线|声音|不可出错)】\n([\s\S]*?)(?=^【(?:本段目标|参考绑定|空间|环境|时间线|声音|不可出错)】|$(?![\s\S]))/gm)].map(m=>[m[1],m[2].trim()])); }
function set(s,name,body) { const b=blocks(s);b[name]=body;return PROMPT_HEADINGS.map(k=>'【'+k+'】\n'+b[k]).join('\n'); }
function one(duration=8) {return set(fixture,'时间线','【0:00-0:'+String(duration).padStart(2,'0')+'】镜头1\n50mm中景，机位在桌南眼高平视固定。陈默看向林岚，把手留在桌沿。');}

test('seven blocks preserve mixed-media facts and exact cross-shot speech',()=>{
 const r=good(fixture,{expectedDialogue:source});assert.deepEqual(r.facts.headings,PROMPT_HEADINGS);
 assert.equal(r.facts.duration,8);assert.equal(r.facts.assets,3);assert.equal(r.facts.dialogueCheck.shotMatches,true);
 assert.deepEqual(r.facts.shots.map(x=>[x.number,x.start,x.end]),[[1,0,3.5],[2,3.5,8]]);
});
test('V3 permits only the documented sound-after-space exception',()=>{
 const b=blocks(fixture);good(DIALOGUE_ORDER.map(k=>'【'+k+'】\n'+b[k]).join('\n'));
 bad(['声音',...PROMPT_HEADINGS.filter(x=>x!=='声音')].map(k=>'【'+k+'】\n'+b[k]).join('\n'),'SECTION_ORDER');
});
test('each of the seven duties is required exactly once and nonempty',()=>{
 for(const name of PROMPT_HEADINGS){
  bad(fixture.replace('【'+name+'】','【未知】'),'SECTION_MISSING');
  bad(fixture.replace('【'+name+'】','【'+name+'】重复\n【'+name+'】'),'SECTION_DUPLICATE');
  bad(set(fixture,name,''),'SECTION_EMPTY');
 }
});
test('raw, fenced, BOM, CRLF and inline heading bodies work',()=>{
 good('~~~text\n'+fixture+'\n~~~');good('\uFEFF'+fixture.replaceAll('\n','\r\n'));
 good(fixture.replace('【本段目标】\n','【本段目标】'));
 bad('这是提示词：\n'+fixture,'PROMPT_PREFIX');
});
test('old six-part containers, unknown cards and self-check outputs are rejected',()=>{
 for(const h of ['风格','素材绑定','全局约束','本段戏剧任务','本段情绪总控','头锁区','收尾约束'])bad(fixture+'\n【'+h+'】旧内容','LEGACY_SECTION');
 bad(fixture+'\n【角色卡】新卡','UNEXPECTED_SECTION');bad(fixture+'\n【自检】通过','SELF_CHECK_HEADING');
});
test('new shot title supports descriptive names but rejects the retired bar-first syntax',()=>{
 good(fixture.replace('镜头1 中景。','镜头1【固定】桌面中景。'));
 bad(fixture.replace('【0:00-0:03.5】镜头1 中景。','镜头1｜0:00-0:03.5'),'SHOT_HEADING_FORMAT');
 bad(fixture.replace('镜头2 反应近景。','镜头3 反应近景。'),'SHOT_NUMBERING');
});
test('range boundaries, gaps, overlap, start and invalid seconds are detected',()=>{
 good(one(4));good(one(30));bad(one(3),'DURATION_RANGE');bad(one(31),'DURATION_RANGE');
 for(const [from,to,code] of [['0:00-0:03.5','0:01-0:03.5','SHOT_START'],['0:03.5-0:08','0:04-0:08','SHOT_TIME_GAP'],['0:03.5-0:08','0:03-0:08','SHOT_TIME_OVERLAP'],['0:03.5-0:08','0:03.5-0:03.5','SHOT_TIME_FORMAT'],['0:03.5-0:08','0:03.5-0:60','SHOT_TIME_FORMAT']])bad(fixture.replace(from,to),code);
});
test('event nodes of one continuous take have no new shot numbers',()=>{
 const continuous=set(one(),'时间线','单一连续镜头，全程不剪切。\n【0:00-0:03】50mm，陈默把手放上桌沿，摄影机随陈默靠近桌边。\n【0:03-0:08】摄影机在桌南停住，陈默看向林岚；同一个连续镜头。');
 assert.equal(good(continuous).facts.continuous,true);
 bad(continuous.replaceAll('单一连续镜头，全程不剪切。','').replaceAll('同一个连续镜头。',''),'CONTINUOUS_SCOPE');
 bad(continuous.replace('【0:03-0:08】','【0:03-0:08】镜头2\n'),'SHOT_NODE_MIX');
});
test('shots outside timeline are rejected',()=>bad(fixture.replace('【时间线】','【时间线】仅说明。\n【声音】\n'),'SHOT_LOCATION'));
test('continuous prose does not require repeated lighting or location-sound labels',()=>{
 good(fixture);good(fixture.replace('陈默把手留在桌沿。','陈默把手留在桌沿。光影：窗光稳定。现场声：触桌声。'));
 bad(fixture.replace('陈默把手留在桌沿。','\n\n陈默把手留在桌沿。'),'SHOT_PARAGRAPH');
 good(fixture.replace('陈默把手留在桌沿。','\n陈默把手留在桌沿。'));
 bad(fixture.replace('50mm中景，','机位：50mm中景，'),'LEGACY_ROW');
});
test('an explicit transition on a separate line remains the preceding shot interface',()=>good(fixture.replace('硬切到镜头2，','\n\n硬切到镜头2，')));
test('literal dialogue timing and visible text are content, not stopwatch commands',()=>{
 const s=one().replace('陈默看向林岚，','陈默说：“再等0.5秒。”牌上写着“0:00”。陈默看向林岚，');
 good(s,{expectedDialogue:[{speaker:'陈默',text:'再等0.5秒。'}]});
});
test('dialogue remains inline and is not copied into global sound or goal',()=>{
 bad(fixture.replace('陈默说：“','\n台词：陈默说：“'),'LEGACY_DIALOGUE_LINE');
 bad(set(fixture,'声音','陈默说：“门一直关着，”'),'DIALOGUE_REFERENCE_LOCATION');
 bad(set(fixture,'本段目标','陈默说：“门一直关着，”'),'DIALOGUE_REFERENCE_LOCATION');
});
test('exact source and per-shot allocation catch text and front-loading regressions',()=>{
 bad(fixture.replace('直到钟响。','直到天亮。'),'DIALOGUE_LOCK',{expectedDialogue:source});
 const moved=fixture.replace('“门一直关着，”','“门一直关着，直到钟响。”').replace('陈默从画外继续说：“直到钟响。”','声音继续。');
 assert.equal(validatePrompt(moved,{expectedDialogue:source}).ok,false);
});
test('long-dialogue stage directions are nonspoken and preserve original punctuation',()=>{
 const s=fixture.replace('门一直关着，','门一直【陈默握紧桌沿】关着，');
 const r=good(s,{expectedDialogue:source});assert.equal(r.facts.dialogue[0].annotations.length,1);
 bad(fixture.replace('门一直关着，','门一直关着。'),'DIALOGUE_LOCK',{expectedDialogue:source});
});
test('quotation text cannot create sections and malformed quotes are rejected',()=>{
 good(one().replace('陈默看向林岚，','陈默说：“【空间】是标签，不是地点。”陈默看向林岚，'),{expectedDialogue:[{speaker:'陈默',text:'【空间】是标签，不是地点。'}]});
 bad(fixture.replace('关着，”','关着，'),'QUOTE_BALANCE');
 bad(fixture.replace('门一直关着，','门一直【停顿关着，'),'STAGE_BALANCE');
 bad(fixture.replace('陈默说：“门一直关着，”','陈默说{门一直关着，}'),'LEGACY_DIALOGUE_BRACES');
});
test('no-reference mode keeps an explicit declaration and no invented asset',()=>{
 const s=set(fixture,'参考绑定','无外部参考素材。');assert.equal(good(s,{generationMode:'text'}).facts.assets,0);
 bad(set(fixture,'参考绑定','没有图片，角色随便。'),'ASSET_EMPTY_DECLARATION');
 bad(set(fixture,'参考绑定','@image1=角色。无外部参考素材。'),'ASSET_EMPTY_CONFLICT');
});
test('assets are canonical, bound once and never source paths or ranged aliases',()=>{
 for(const t of ['@Image1','@image01','@image1.png','@img1'])bad(fixture.replace('@image1',t),'ASSET_TOKEN_FORMAT');
 bad(fixture.replace('【空间】','【空间】@image1'),'ASSET_REFERENCE_LOCATION');
 bad(fixture.replace('【声音】','【声音】@video1'),'ASSET_DUPLICATE_REFERENCE');
 for(const locator of ['C:/refs/hero.png','https://example.com/x.png'])bad(set(fixture,'参考绑定',locator),'ASSET_SOURCE_LOCATOR');
 bad(set(fixture,'参考绑定','@image1-@image2 为人物。'),'ASSET_RANGE');
 good(set(fixture,'参考绑定','@image1为人物，@video1为运镜，@audio1为音色。'));
});
test('combined 50 and per-type limits count actual sources, not highest IDs',()=>{
 const refs=[...Array.from({length:30},(_,i)=>'@image'+(i+1)),...Array.from({length:10},(_,i)=>'@video'+(i+1)),...Array.from({length:10},(_,i)=>'@audio'+(i+1))].map(x=>x+'=参考。').join('\n');
 assert.equal(good(set(fixture,'参考绑定',refs)).facts.assets,50);
 bad(set(fixture,'参考绑定',refs+'\n@image31=人物。'),'ASSET_LIMIT');
 bad(set(fixture,'参考绑定',Array.from({length:31},(_,i)=>'@image'+(i+1)+'=人物。').join('\n')),'ASSET_TYPE_LIMIT');
});
test('augmentation explicitly preserves sparse numbering and appends after the highest ID',()=>{
 const s=set(fixture,'参考绑定','@image8=人物。\n@image9=场景。');
 bad(s,'ASSET_NUMBERING');good(s,{preserveAssetNumbering:true,existingAssetTokens:['@image8']});
 bad(s.replace('@image9','@image2'),'ASSET_APPEND_NUMBERING',{preserveAssetNumbering:true,existingAssetTokens:['@image8']});
 bad(s,'ASSET_BASELINE',{existingAssetTokens:['@image8']});
 bad(s,'ASSET_EXISTING_ORDER',{preserveAssetNumbering:true,existingAssetTokens:['@image9','@image8']});
});
test('reference versus actual frame modes cannot silently borrow each other’s input roles',()=>{
 good(fixture,{generationMode:'reference'});
 const frames=set(one(),'参考绑定','@image1 = 首帧。\n@image2 = 尾帧。');good(frames,{generationMode:'first_last'});
 bad(frames+'','MODE_ASSETS',{generationMode:'first_frame'});
 bad(set(frames,'参考绑定','@image1 = 首帧，仅作参考。\n@image2 = 尾帧。'),'MODE_FRAME_CONFLICT',{generationMode:'first_last'});
 good(set(one(),'参考绑定','@image1 = 实际首帧，动作从图中状态继续。'),{generationMode:'first_frame'});
 bad(fixture,'MODE_ASSETS',{generationMode:'text'});
});
test('editing and extension require a real source video',()=>{
 for(const mode of ['edit','extend']) {good(set(one(),'参考绑定','@video1 = 源视频。'),{generationMode:mode});bad(set(one(),'参考绑定','@image1 = 人物。'),'MODE_SOURCE',{generationMode:mode});}
 bad(fixture,'GENERATION_MODE',{generationMode:'invented'});
});
test('CLI JSON and exit codes reflect the current contract',()=>{
 const cli=fileURLToPath(new URL('../scripts/validate-prompt.mjs',import.meta.url));
 let p=spawnSync(process.execPath,[cli,'--json'],{input:fixture,encoding:'utf8'});assert.equal(p.status,0);assert.equal(JSON.parse(p.stdout).facts.headings.length,7);
 p=spawnSync(process.execPath,[cli,'--json'],{input:fixture.replace('【空间】','【未知】'),encoding:'utf8'});assert.equal(p.status,1);assert.equal(JSON.parse(p.stdout).ok,false);
});
