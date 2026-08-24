# Canonical Nine-Layer Prompt Schema

Every formal prompt uses Chinese and the following exact headings in this exact order:

```text
【头锁区·全片统一】
【元信息】
【风险预判】
【衔接入】
【时间线 卡N秒】
【衔接出】
【声音设计】
【参考图权重】
【执行约束】
```

Do not add another formal layer. The last layer is model-facing instruction, not a review or report.

## Canonical Template

```text
【头锁区·全片统一】
模型：Seedance 2.5
创作意图：{L1锁定的观众理解与情绪落点}
媒介与世界：{L1锁定的媒介、真实度、物理/超自然规则}
视觉语法：{L1锁定的构图、光线、色彩、质感、摄影原则}
人物与实例：
- {角色ID×物理实例数}：{身份、稳定外观、服装、独特标记、姿态/行为基线}
关键物品与空间：{道具ID、数量、归属、固定空间锚与世界轴线}
逐字内容：{如有，列出不可改写的角色台词或旁白；正文仍在时间线绑定}

【元信息】
片段：{segment_id}
时长：{4-30}s
唯一戏剧任务：{本段唯一变化}
观众落点：{结束时必须理解或感受到的结果}
动作模式：{NARRATIVE | ACTION_LITE | ACTION_FULL}
画幅/规格：{仅填写用户或项目已给出的值}

【风险预判】
{风险事实} -> {模型应生成的正向目标状态}
{只写会改变本段结果的活跃风险；不写评分、复盘或通过结论}

【衔接入】
0.0-0.5s稳定入场：{构图、角色/实例、世界与屏幕位置、姿态、朝向、视线、接触、道具、光线、声音}
入场动作相位与动量：{静止/动作进行到何处；方向、速度、受力}
来源：{上一段衔接出/独立开场/已声明时间跳切}

【时间线 卡{时长}秒】
0.5-{尾部安全区起点}s：
- 镜头：{L1锁定的景别、机位、镜头行为与切换}
- 在场与空间：{可见实例、位置、朝向、距离、遮挡、路径}
- 表演/动作：{准备 -> 触发 -> 动作或接触 -> 反馈 -> 反应 -> 结果}
- 对白/旁白：{角色ID说{逐字台词} / 旁白{逐字旁白}；无则省略}
- 同步证据：{道具、环境、画面文字、动作声在确切时点的变化}
{按L1继续分块；全时段连续、无重叠、无空档}

【衔接出】
{尾部安全区起点}-{总时长}s稳定出场：{最后构图、角色/实例、位置、姿态、朝向、视线、道具、光线}
动作相位与动量：{完成并hold/持续到精确相位；方向、速度、受力}
声音尾：{停止、持续或跨切的声源}
下一段接口：{下一段必须复现的状态；独立结束则写独立结束}

【声音设计】
环境音：{声源、空间位置、时段与变化}
动作音：{动作/接触点、材质、时点、距离层次}
人声：{角色ID/旁白 -> 唯一声源 -> 时间窗 -> 画内/画外 -> 口型目标}
音乐：{仅写用户或项目已经确定的政策与变化}
声音桥：{J-cut/L-cut/无；起止位置}

【参考图权重】
素材总数：{N}/50
@image1：{定义对象或职责}｜继承：{具体特征}｜不继承：{冲突内容}｜作用范围：{镜头/时段}
{其余素材按类型分别连续编号为 @imageN / @videoN / @audioN；每个占位符仅写这一处}
{“权重”使用主身份/局部特征/动作/空间/声音等语义职责；不编造数字权重}

【执行约束】
{用简短正向祈使句写本段实际需要的身份、实例、空间、因果、连续性、对白声源与动作物理要求}
{每条都直接影响生成行为；不写检查步骤、评分、报告或通过结论}
```

## Filling Rules

- Use only approved L1 content and confirmed compiler facts.
- Replace `N` / `{时长}` in the timeline heading with the actual segment duration; the other eight headings remain literal.
- Every timeline block states an observable change; every cause precedes its effect.
- Mention IDs, counts, positions, exact text, and boundary states precisely; avoid decorative adjectives that carry no observable instruction.
- Put camera and performance choices from L1 into the time block where they occur.
- Put action execution details from the action contract into the corresponding time block; do not add an action appendix.
- Omit a field's line when it is irrelevant, but keep all nine headings.
- For an independent opening or ending, state that condition explicitly instead of pretending there is an adjacent segment.
- In `【风险预判】`, translate the active risk into a desired visible state. Do not explain internal reasoning.
- In `【参考图权重】`, “weight” means responsibility and priority unless an actual platform field is provided by the user.
- Deduplicate sources before assigning contiguous, type-specific placeholders in first-use order: `@imageN`, `@videoN`, and `@audioN`, each sequence starting at 1.
- Print each placeholder exactly once in the formal prompt, as the leading token of its one `【参考图权重】` line. Merge all duties and time ranges there; use semantic entity IDs everywhere else.
- Never expose an asset path, filename, URL, upload label, or platform-native source ID in the formal prompt.
- In `【执行约束】`, write only instructions the generation model should obey. No evaluation language belongs there.
