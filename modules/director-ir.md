# Director IR：导演域的轻量交接格式

Director IR 保存“为什么这样拍、具体拍什么、镜头结束后留下什么状态”。它是导演思考与 L1 的结构化底稿，不是 Seedance 提示词，也不承载平台语法。

机器可读约束见 [director-ir.yaml](../schemas/director-ir.yaml)。日常单场景可在内存中维护，无需落盘。

## 一、最小结构

```yaml
meta:
  segment_id: S01
  l1_version: 1
  duration_s: 12
  task_mode: CREATE_AUTO
  action_mode: NARRATIVE

authority:
  user_locks: []
  story_facts: []
  exact_dialogue: []
  reference_assets: []
  assumptions: []

drama:
  premise: "本段实际发生的事"
  objective: "人物当下目标"
  obstacle: "可见阻力"
  turn: "本段不可逆变化"
  audience_landing: "结尾要让观众看懂并感到什么"

continuity:
  entry_state: "人物/物品/空间/光线/声音的进入状态"
  exit_state: "供本段结尾和下一段继承的状态"

visual_strategy:
  viewpoint: "摄影机站在谁的认知或情感一侧"
  master_shot_logic: "用什么主镜骨架承载戏点"
  rhythm: "何处积累、何处转折、何处停留"
  look_and_sound: "会改变叙事的光色与声音策略"

knowledge_applications:
  - source: "references/cinema/... 或 references/masters/... §具体段落/场景"
    principle: "来源中的因果方法"
    transformation: "为本场做出的变化"
    applied_to: [SH01]

shots:
  - id: SH01
    time: "00:00.0-00:04.0"
    function: "这一镜给故事带来的变化"
    image_action: "可见主体、动作、反应和环境变化"
    camera: "景别/视点/机位/运动/焦点，以及运动动机"
    staging: "人物和关键物的空间关系、视线、出入画"
    performance: "可观察的表演行为与潜台词"
    sound: "对白、环境声、关键音效或有意留白"
    transition: "为什么在这里开始/结束/切换"
    end_state: "这一镜交给下一镜的状态"

action: null

approval:
  status: turn_locked
  compiled_from_version: 1
```

镜头数量由戏点和时长决定，不为填格式强拆镜头。字段没有改变画面结果时可用一句合并表达；用户锁、逐字对白、进入/退出状态不可省略。

## 二、字段边界

### `authority`

- `user_locks`：原样保存用户点名锁定的镜头、风格、角色行为、素材关系或禁止变更项。
- `story_facts`：输入中已经成立的剧情、人物关系、世界设定。
- `exact_dialogue`：保存角色名、逐字文本和所属镜头，可选记录表演口径；语法包装留给编译器。
- `reference_assets`：保存素材类型、内部来源 ID、用途和它绑定的对象。来源路径或文件名只留在内部 IR；L1 使用语义标签，编译器再生成一次性的 `@imageN / @videoN / @audioN` 占位符。单段总素材数遵守已确认的 50 上限。
- `assumptions`：只放推进设计所需但尚未由用户确认的最小假设，不混进锁定项。

### `drama`

`premise` 复述事件；`objective` 和 `obstacle` 产生可拍冲突；`turn` 决定镜头结构；`audience_landing` 是所有镜头取舍的判据。一个镜头若既不推进信息、关系、情绪、动作因果，也不建立必要空间，应被合并或删除。

### `continuity`

进入/退出状态至少覆盖当前任务中会跨镜变化的对象：人物位置与朝向、手中物、服装/伤势、环境变化、主光方向、关键声音、尚未完成的动作。多段任务中，前段 `exit_state` 是后段 `entry_state` 的事实来源。

### `visual_strategy`

只记录统领整段的导演选择：视点、主镜框架、节奏曲线、光色和声音态度。镜头级规格留在 `shots`，避免同一规则重复两次。

### `knowledge_applications`

这是创意依据，不是读库日志。每条必须说明：

1. 来源的具体段落或作品场景。
2. 借用的是因果方法，而非“像某导演”这类表面标签。
3. 为当前人物、空间和时长做了什么变形。
4. 最终落实到哪些镜头。

通常保留最能解释核心选择的少量条目；实际读取要求由知识路由控制。

### `shots`

每镜必须有一个清晰 `function` 和可见的 `end_state`。`camera` 先写摄影机为什么动，再写怎么动；`performance` 写可观察行为，不用抽象情绪词替代动作；`transition` 说明切点或长镜内段落转换的动机。

### `action`

`NARRATIVE` 保持 `null`。`ACTION_LITE` / `ACTION_FULL` 使用动作模块补充战术目标、空间方向、逐拍因果、惯性、接触后果与恢复状态；审美决策仍留在 `visual_strategy` 和对应镜头。

### `approval`

- `draft`：等待用户确认。
- `turn_locked`：自动创作同轮编译所使用的冻结快照。
- `user_approved`：用户明确确认的版本。
- `revision_requested`：用户已经提出修改，禁止继续以旧版编译。

编译结果需记录其 `compiled_from_version`，以免多轮对话串用旧镜头。

## 三、IR 到 L1

L1 是 IR 的可读投影，保留以下内容：

1. 核心意图与观众落点。
2. 锁定事实、逐字对白和素材绑定。
3. 段首/段尾连续状态。
4. 导演总策略及具体借鉴。
5. 按时间排列的镜头表。
6. 条件动作链。
7. 版本与锁定状态。

平台字段、成片提示词标题和编译句式不进入 L1。编译器从 L1 取值，但不反向修改 IR 的导演决定。
