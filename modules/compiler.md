# Nine-Layer Compiler

The compiler translates a locked L1 director design into the canonical Seedance 2.5 prompt. It is a semantic-preserving compiler, not a second director.

Read `references/model/INDEX.md`, then load only the issue-specific model reference named there. For every full prompt, read `references/model/nine-layer-schema.md` and `references/model/capability-registry.yaml`.

## Input Contract

Accept any combination of:

- approved L1 director design or an existing locked shot list;
- user locks, exact story facts, exact dialogue, and world rules;
- segment duration and neighboring segment states;
- asset source locators, media types, and the intended responsibility of each asset;
- an internal action contract from `action-design.md`.

Treat user locks and approved L1 as immutable creative input. The compiler may make relationships explicit, assign IDs consistently, divide time, and compress redundant wording. It may not add, remove, reorder, restage, or reinterpret shots, performances, actions, outcomes, or aesthetics.

When a missing operational value is essential, derive the least-committal value from the locked spatial and temporal facts. Keep any remaining creative uncertainty outside the formal prompt as one compact assumption; never hide a new creative choice inside compilation.

## Compile Pipeline

### 1. Freeze the Source

Create an in-memory source ledger:

```yaml
source_ledger:
  user_locks: []
  approved_l1: []
  exact_dialogue: []
  entities: []
  world_rules: []
  segment_duration:
  entry_state:
  exit_state:
  assets: []
```

No runtime log or project file is required for an ordinary single segment.

For each asset, keep its source locator and output placeholder separate. A local path, filename, URL, upload label, or platform-native ID may identify the source inside this ledger, but the formal prompt receives only the canonical placeholder.

### 2. Normalize IDs and States

- Give every speaking character, continuity-critical character, prop, device, and off-screen source one stable ID.
- Distinguish one physical body from reflections, screens, shadows, memories, or other non-body appearances.
- Record position, facing, gaze, contact, possession, condition, visibility, and motion only where they affect this segment.
- Separate world direction from screen direction.
- Preserve exact source locators internally. Deduplicate identical sources, then assign canonical output placeholders by media type and first-use order: `@image1...`, `@video1...`, and `@audio1...`.
- Do not copy a source path, filename, URL, upload label, or platform-native ID into the formal prompt.

### 3. Enforce the Confirmed Platform Contract

Use only the hard facts in `references/model/capability-registry.yaml`:

- segment duration is `4-30s`;
- all reference assets combined are `<=50`;
- the first and last `0.5s` are stability zones;
- dialogue syntax is `角色ID说{逐字台词}` and narration syntax is `旁白{逐字旁白}`.

Do not manufacture a numeric weight, token limit, camera parameter, negative-prompt field, platform switch, or other capability.

### 4. Allocate Time

- Cover the entire segment from `0.0s` to its declared end with ordered, non-overlapping blocks.
- Use `0.0-0.5s` to establish a reproducible entry state and the last `0.5s` to settle into the declared exit state.
- Give each block one dominant visual event or state change.
- Place dialogue, contact, reaction, and sound at the time they occur.
- Preserve L1 rhythm. Timing clarifies the design; it does not redesign it.

For action modes, inject the action contract's causal beats. For dialogue, apply `references/model/dialogue-binding.md`. For sequences, apply `references/model/continuity.md`.

### 5. Compile the Nine Layers

Emit the exact order and headings defined in `references/model/nine-layer-schema.md`:

1. `【头锁区·全片统一】`
2. `【元信息】`
3. `【风险预判】`
4. `【衔接入】`
5. `【时间线 卡{时长}秒】`
6. `【衔接出】`
7. `【声音设计】`
8. `【参考图权重】`
9. `【执行约束】`

Each fact has one primary home. Repeat it only when the model needs the same fact at an exact time or continuity boundary. Asset placeholders are stricter: each appears once only, in `【参考图权重】`; timed use is expressed in that line's scope and by semantic entity IDs in the timeline.

### 6. Compress Without Semantic Loss

When the prompt is dense, preserve in this order:

1. user locks, exact dialogue, story result, and world rules;
2. character identity, instance count, speaking source, and critical props;
3. entry/exit state, spatial causality, and action continuity;
4. shot, performance, and timing decisions locked by L1;
5. reference responsibilities and active execution constraints;
6. decorative modifiers already marked flexible by L1.

Delete duplication and synonyms before deleting information. Never replace concrete states with praise words such as “电影感”“高级感” or “震撼”.

## Layer Responsibilities

- `【头锁区·全片统一】`: global identity, world, medium, approved visual grammar, viewpoint, and exact immutable facts.
- `【元信息】`: segment ID, duration, dramatic task, audience landing, action mode, and format facts actually supplied.
- `【风险预判】`: current high-risk failure translated into a positive target state; it is an instruction layer, not an audit.
- `【衔接入】`: reproducible first `0.5s` state, including incoming action phase and sound bridge.
- `【时间线 卡{时长}秒】`: executable shots and beats, with time, framing from L1, staging, performance, action physics, dialogue, and synchronized visible results. Replace `{时长}` with the actual segment duration.
- `【衔接出】`: reproducible final `0.5s` state and next-segment handoff.
- `【声音设计】`: environment, effects, dialogue/narration sources, music policy if supplied, spatial origin, timing, and carryover.
- `【参考图权重】`: asset responsibility map. The heading is fixed; use semantic priority and scope, not invented numeric weights.
- `【执行约束】`: concise model-facing imperatives needed to preserve this segment's identity, count, causality, continuity, dialogue source, and active high-risk state.

## Dialogue Compilation

The braces contain spoken text only:

```text
角色A说{门没有锁，是我们一直没推。}
旁白{那天以后，钟再也没有走过。}
```

Place delivery, mouth visibility, emotion, timing, and listener behavior outside the braces. Preserve every character and punctuation mark inside braces unless the user revises the line.

## Asset Compilation

Count image, video, and audio references together. For each referenced asset write:

```text
@image1：定义对象或职责｜继承：具体特征｜不继承：冲突内容｜作用范围：镜头/时间段
```

Use these steps before emitting the layer:

1. Deduplicate repeated mentions of the same physical source.
2. Assign separate contiguous sequences for images, videos, and audio, all starting at 1.
3. Merge every duty and time range for one source into its one placeholder line.
4. Emit that placeholder exactly once in the whole formal prompt and never repeat it in the head lock, timeline, sound, or execution layers.

The source locator remains internal and is never used as the display token. One asset defines only its stated responsibility. A reference image does not create an extra body or prop. A motion reference does not replace character identity. An audio reference does not import background voices, music, or picture content unless explicitly locked.

## Output Discipline

For a full compilation, output one complete nine-layer Chinese prompt per segment and end at `【执行约束】`. Keep process narration, evaluation material, reading history, and capability commentary outside the deliverable.

For `OPTIMIZE`, preserve the locked creative design and return the complete revised prompt unless the user requests only a replacement block. For `DIAGNOSE`, follow `modules/diagnosis.md`.
