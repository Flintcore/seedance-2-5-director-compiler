# Seedance 2.5 Director Compiler · 0.6.11

轻量导演设计与提示词编译。已确认内容保真转写；开放的新设计按需实读电影与大师知识。不是六环编排器，不增加确认轮次或生成后自检。

## 当前执行入口

1. [SKILL.md](SKILL.md) 选择当前对象与设计/编译边界。
2. [提示词编写 SOP](modules/prompt-writing-sop.md) 是每次设计、完整编译及正式改稿的必读骨干；同上下文且版本未变可复用。
3. [唯一元模板](modules/prompt-template.md) 输出本段目标、参考绑定、空间、环境、时间线、声音、不可出错七块。
4. [结构变体](references/writing/variants.md) 按模式/任务选用；[知识路由](modules/knowledge-routing.md) 和 [完整调用地图](references/writing/knowledge-map.md) 将具体设计问题连接到原有正文。

七块不是七张技术表。时间线每镜是必要摄影定位、起始画面、人物行动/说听反应、运镜与局部光声、结束状态的一段连贯叙述。共享信息不挤掉人物事件，也不逐镜重复固定尾句。标题写【0:00-0:04】镜头1；镜内靠事件而非秒表组织。

## 模式与既有锁

全能参考默认不把参考图当硬首帧；首尾帧/首帧任务要实际放进平台对应输入槽。编辑与延长使用真实源视频。模式细节与证据见 [模式表](references/writing/modes-and-evidence.md)。普通参考各一次 @，正文稳定姓名；逐字双引号对白在实际发声镜，跨镜续句仍就地写全本镜听到的词。连续戏4–30秒优先一次生成。

## 知识完整性

现有51份影视正文与184份大师正文（67份方法论、117份作品）保留；新写作 SOP 连接这些内容，不以模板替代设计阅读。新设计读相关正文与所选大师作品全文，局部修订读对应章节，纯确认稿编译保留已定设计。白模与AU等条件模块仅实际问题触发。

用户手册的总纲、六节、18变体与案例映射见 [覆盖清单](references/writing/handbook-coverage.md)。《卖龙》课例只作为有来源的案例，不进入其他项目默认人物、空间或节奏。

## 维护与发布

开发用 `node --test tests/*.test.mjs`、`node scripts/validate-skill.mjs --json`、`node scripts/audit-knowledge-routes.mjs --json`、`git diff --check`；它们不是每次提示词生成的额外关卡。文本/链接/哈希验证不等于实际模型成片通过。两仓各自独立分发，不互设软链接。

历史版本见 [CHANGELOG.md](CHANGELOG.md)。本轮知识源正文未改，不伪称全量重同步。按用户长期要求，本地验证后由维护主线程提交推送 GitHub。
