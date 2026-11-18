---
name: seedance-2-5-director-compiler
description: "Design film-quality shots from scripts, storyboards, director notes, and references, then compile the approved design into a native Seedance 2.5 storyboard prompt. Use for Seedance 2.5 shot design, director collaboration, prompt compilation, continuity repair, dialogue binding, action scenes, prompt optimization, Blender previs reference integration, and result diagnosis."
metadata:
  label: "Seedance 2.5 Director Compiler"
  version: "0.7.3"
---

# Seedance 2.5 Director Compiler

轻量的单执行者：先解决导演决定，再把已定设计写成原生中文提示词。导演知识负责拍什么、为什么；手册 SOP 负责怎样写。普通单场不启动角色链，不生成过程日志。

## 先走这个入口

1. 实际读 [运行编排](modules/orchestration.md)，按**仍需作出的决定**选路，不按“优化/编译”字样或已有镜号判断。有故事和技术参数但观看、调度、表演尚未定，仍是设计。
2. 新设计实际读 [内置导演地基](modules/runtime-foundation.md)；正式写作读 [唯一运行 SOP](modules/prompt-writing-sop.md)。同上下文同版本已取得的正文直接复用；原文全册保真保存，当前任务按完整单元选读，不再每次全册吸收。模板和索引不抵当前必要正文。
3. 风格未定或选用外挂时沿 [外接流程](modules/external-knowledge.md)；已选路线复用。先按内置基础形成意图、观看、行动、构图与光声；基础和已选知识完整单元已经解决当前选择，就直接形成L1，不再为了“新设计”读另一套基础。确有未决问题才查 [知识路由](modules/knowledge-routing.md#决策驱动读取与交接) 的相关完整节并直达正文，不通读路由、索引、总纲、镜头设计或IR。被选作品首次用于新判断时读作品全文；有来源名但没改变具体决定，不算应用。
4. 仅当设计已经确定，进入 [编译](modules/compiler.md)：读 [完整成稿范本](references/writing/handbook-gold-mai-long.md) 与 [唯一元模板](modules/prompt-template.md)，保真写稿。没有新设计就不重新选大师。`DIRECTOR_CHECKPOINT` 等用户确认；`CREATE_AUTO` 同轮展示 L1 后按该快照编译，不冒充历史批准。

这四项是入口与分支，不是每个任务都串行跑四轮。仅读索引、元模板或搜索命中行就从新剧情直接出稿，属于漏读。被截断的工具返回不计作完整取得，按原文件章节/行范围补齐；不要为省调用把多份长正文合并到一次截断输出。

普通自然L1直接使用 [基础内的交付合同](modules/runtime-foundation.md#自然l1与扩读边界)，不以整本IR/schema为前提。[镜头设计](modules/shot-design.md) 只解决仍开放的覆盖/表演/摄影专项；[Director IR](modules/director-ir.md) 仅供需要结构化持久交接的任务。跨域取舍仍无法落定时，才取 [导演判断总纲](references/cinema/导演体系/导演判断总纲.md) 的相应完整节；[镜组四问](references/cinema/戏点选择与主镜框架法.md#镜头组四问摄影选择的上游) 与 [演员行动](references/cinema/角色行为与动作叙事参考库.md#actor-craft-four-senses) 的基本方法已在常驻基础，不按“有新戏/有人物”再次加载。

## 不变的边界

- 最新用户锁、确认 L1、原故事与逐字对白优先。编译只澄清表达，不改镜头、事件、声源或未授权的表演；新发现实质矛盾按 [设计判断](modules/design-judgment.md) 定点说明，需改用户锁时等选择。末次编译按[基础检查](modules/delivery-check.md)检查当前稿，不重新查库或另加角色。
- 单次生成 **4–30秒**，最多 **50个**素材；镜多、文字长、动作复杂不自动拆生成段。长片可先看全片戏核、节拍与粗分段，但连续制作默认每轮只详细设计、锁定或编译**当前一个生成段**。前段设计末态只是预期；后段等选用成片的实际切出状态可知再开工。分支沿[生成段边界闸门](modules/orchestration.md#生成段边界闸门)。
- 输出保持七块：本段目标、参考绑定、空间、环境、时间线、声音、不可出错。时间线每镜连续自然语言：必要摄影定位与画面左右/前中后景起幅，再写姓名明确的行动、对白、接收及随事运镜。世界位置和屏幕投影分开；构图可以随行动变化，切镜不搬人物。每镜独立写焦距与当前受光，环境固定世界灯位/颜色/强弱；详见SOP，目标不统一焦距。
- 对白在发生处使用中文双引号逐字保留。跨镜每镜写当镜真实听到的连续原词与原声源；单句未说完就切反应可以成立。角色叙述沿稳定姓名，重新起句或换主体仍点名；对白内的代词不改。
- 每份素材只在参考绑定出现一次 `@imageN/@videoN/@audioN`；正文用语义名称。既有编号保持，新素材顺延；路径、文件名留内部。无素材仍保留绑定块，写无外部参考素材。
- 标题时码是预算，镜内由事件/原词/气口驱动，不写逐秒动作控制或首末半秒稳定区。全能参考不等于硬首帧，首尾帧按实际模式；能力疑问查 [能力证据](references/model/capability-registry.yaml)，不新增未经确认的参数保证。
- 用户明确要求4—8秒精简单镜时，采用模板中的手册①1.7例外；短时长本身不触发省栏。形式不替代完整事件与表达载体。

## 条件入口：只处理当前问题

| 本轮要解决什么 | 入口 |
|---|---|
| 表演薄、目光/听说/心理转折需要细化；AU/FACS | [微表演](modules/micro-performance.md) → 对应完整章节；普通动作不自动加载全套表演库 |
| 追逐、碰撞、持续搏斗、港式连续特技、玄幻动作 | [动作设计](modules/action-design.md)，区分 NARRATIVE / ACTION_LITE / ACTION_FULL；先形成交锋链和力量后果再定覆盖，动作反应可重叠，不套慢文戏停顿 |
| 身高、承托、路径、构图矛盾或视觉负面补丁 | [正向场面](references/model/positive-spatial-constraints.md)：先让共同参照、接触、路线与透视成立 |
| 规则适用有冲突 | [电影规则边界](modules/film-rule-scope.md)：保真实物理/连续性，惯例按条件，不恢复技巧配额 |
| 白模计划/制作、当前 Seedance 工作里的 Blender 搭场景或实际预演视频 | [白模参考](references/model/previs-reference.md)：最低必要几何；既有稿加视频只补角色映射/职责，保留原动作表演；普通设计不启动 Blender |
| 成片故障 | [诊断](modules/diagnosis.md)：保住已对部分，修最早失败层；本轮仅咨询就不写完整成稿 |

所有影视/大师正文仍由 [知识路由](modules/knowledge-routing.md)、[完整知识地图](references/writing/knowledge-map.md) 与实际索引连接；根据未决问题读正文，不全库扫，也不零读取。明确局部视线/构图/表演修复读相关章，不重做整场和重选大师。

## 交付与执行纪律

- 普通单场默认一个执行者在内存完成。只有用户明确要求委派，或复杂独立子问题确实需要且宿主允许时，才使用限定职责的协作者；不因为工具可用就启动三角色链。详见编排。
- 本轮含新设计时给当前段完整 L1；默认 `CREATE_AUTO` 同轮给该段匹配提示词，明确要求先确认则停 L1。纯编译不再交一份重设计。
- 每个生成段一个完整中文提示词围栏；诊断给最小替换块。建议、能力说明、来源应用说明在提示词外，不附读书日志、评分、自检或反复重写循环。
- 多场、持续协作或用户要文件时才落盘；保留现有状态与编号，定点更新。实际生成须有工具结果，不把文本验证说成成片通过。

## 当前成稿重点 · 2026-11-17

本项目视频直出是粗剪素材，只交付对白、实际环境声与动作物理声；配乐和非现场情绪音效留后期，执行[SOP同期声交付](modules/prompt-writing-sop.md#sync-sound-delivery)，不因外接审美包或音乐案例自动加乐。

本项目禁用把人脸正面均匀补亮、抹平明暗与空间层次的大平光；设计、编译与末检统一执行 [SOP 项目布光禁令](modules/prompt-writing-sop.md#project-flat-light-ban)，知识中的一般例外不自动豁免用户锁。

每镜写具体左右与实际前中后景、独立焦距、运镜引起的画面变化和主体/背景受光。常驻基础先定信息藏露，再设计剪影与背景分离、局部明暗塑形、有依据且最低必要的补光；不为始终看清脸抹掉暗面。沿 [场景与视频双层合同](modules/prompt-writing-sop.md#scene-video-lighting)，场景光场和导演逐镜受光都要有，互不替代，也不强制先出场景图。世界光源可在画外，人物进出光区的明暗变化保留；伦勃朗仅是选项，可见光束需介质，切镜不搬灯。每段正文自足，末栏不凑项；独立段接点在同轴侧换视角至少30°，保世界状态而非复制末帧，见[SOP](modules/prompt-writing-sop.md#segment-boundary)。
