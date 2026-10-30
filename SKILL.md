---
name: seedance-2-5-director-compiler
description: "Design film-quality shots from scripts, storyboards, director notes, and references, then compile the approved design into a native Seedance 2.5 storyboard prompt. Use for Seedance 2.5 shot design, director collaboration, prompt compilation, continuity repair, dialogue binding, action scenes, prompt optimization, Blender previs reference integration, and result diagnosis."
metadata:
  label: "Seedance 2.5 Director Compiler"
  version: "0.6.7"
---

# Seedance 2.5 Director Compiler

轻量的单执行者：先解决导演决定，再把已定设计写成原生中文提示词。导演知识负责拍什么、为什么；手册 SOP 负责怎样写。普通单场不启动角色链，不生成过程日志。

## 先走这个入口

1. 实际读 [运行编排](modules/orchestration.md)，按**仍需作出的决定**选路，不按“优化/编译”字样或已有镜号判断。有故事和技术参数但观看、调度、表演尚未定，仍是设计。
2. 新设计、整段重写、首次正式编译：读 [写作 SOP](modules/prompt-writing-sop.md)，按其“原文 SOP 读取”取得独立手册及①—⑥全文和适配。同上下文同版本已取得的正文直接复用；局部改动只取相关完整节，模板和索引不抵正文。
3. 设计路径进入 [知识路由](modules/knowledge-routing.md#决策驱动读取与交接)：先理解创作意图与镜组观看，再实读相关影视完整章节和选中大师作品全文，最后作摄影选择。按 [镜头设计](modules/shot-design.md) 与 [Director IR](modules/director-ir.md) 把来源机制变成当前镜头的行动、构图、表演、声画或切点；有来源名但没改变具体决定，不算应用。
4. 仅当设计已经确定，进入 [编译](modules/compiler.md)：读 [完整成稿范本](references/writing/handbook-gold-mai-long.md) 与 [唯一元模板](modules/prompt-template.md)，保真写稿。没有新设计就不重新选大师。`DIRECTOR_CHECKPOINT` 等用户确认；`CREATE_AUTO` 同轮展示 L1 后按该快照编译，不冒充历史批准。

这四项是入口与分支，不是每个任务都串行跑四轮。仅读索引、元模板或搜索命中行就从新剧情直接出稿，属于漏读。被截断的工具返回不计作完整取得，按原文件章节/行范围补齐；不要为省调用把多份长正文合并到一次截断输出。

新建整场或跨域取舍由 [导演判断总纲](references/cinema/导演体系/导演判断总纲.md) 进入相关章；[镜组四问](references/cinema/戏点选择与主镜框架法.md#镜头组四问摄影选择的上游) 与 [演员行动](references/cinema/角色行为与动作叙事参考库.md#actor-craft-four-senses) 依当前未决问题实读，不额外全库加载。

## 不变的边界

- 最新用户锁、确认 L1、原故事与逐字对白优先。编译只澄清表达，不改镜头、事件、声源或未授权的表演；新发现实质矛盾按 [设计判断](modules/design-judgment.md) 定点说明，需改用户锁时等选择。无具体问题不加审查环。
- 单次生成 **4–30秒**，最多 **50个**素材；镜多、文字长、动作复杂不自动拆生成段。真正多段按编排的 `SEQUENCE` 边界。
- 输出保持七块：本段目标、参考绑定、空间、环境、时间线、声音、不可出错。时间线每镜连续自然语言：必要摄影定位与画面左右/前中后景起幅，再写姓名明确的行动、对白、接收及随事运镜。世界位置和屏幕投影分开；构图可以随行动变化，切镜不搬人物。详细文风只由 SOP/范本/模板定义。
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
- 本轮含新设计时给完整 L1；默认 `CREATE_AUTO` 同轮给匹配提示词，明确要求先确认则停 L1。纯编译不再交一份重设计。
- 每个生成段一个完整中文提示词围栏；诊断给最小替换块。建议、能力说明、来源应用说明在提示词外，不附读书日志、评分、自检或反复重写循环。
- 多场、持续协作或用户要文件时才落盘；保留现有状态与编号，定点更新。实际生成须有工具结果，不把文本验证说成成片通过。
