# Native Shot Prompt Compiler

The compiler translates a locked L1 director design into a self-contained Seedance 2.5 shot prompt. It preserves the director's choices and writes them in the readable format used by `seedance-agent-2-5`; it is not a second director.

Read `references/model/INDEX.md`, then load only the model references needed for the active issue. For every full prompt, read `references/model/nine-layer-schema.md` and `references/model/capability-registry.yaml`. The schema filename is retained for compatibility; its contents define the native shot format.

## Input Contract

Accept any combination of:

- an approved L1 director design or an existing locked shot list;
- user locks, exact story facts, exact dialogue, and world rules;
- the current segment duration and, when relevant, its physical boundary state;
- asset source locators, media types, and the intended responsibility of each asset;
- an internal action contract from `action-design.md`.

Treat user locks and approved L1 as immutable creative input. The compiler may make relationships explicit, assign stable semantic IDs, divide time, and remove duplicated wording. It must preserve shot order, performance, action, outcome, and aesthetics. A missing operational value is filled with the least-committal choice supported by the locked facts; unresolved creative uncertainty stays outside the formal prompt.

## Compile Pipeline

### 1. Freeze the Source

Create a small in-memory ledger:

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

An ordinary single segment needs no project file, runtime log, or read-history artifact. Keep source locators internal and keep their output placeholders separate.

### 2. Normalize IDs and States

- Give speaking characters, continuity-critical characters, props, devices, and off-screen sources stable semantic IDs based on the user's story names or natural scene roles. Do not emit `ROLE_A`, `ROLE_B`, `角色A`, or similar bookkeeping labels when the story provides a usable name such as `父亲`, `女儿`, `店员`, or `蒙面人`.
- Distinguish one physical body from a reflection, screen image, shadow, memory, or other non-body appearance.
- Record position, facing, gaze, contact, possession, condition, visibility, and motion only when they affect this segment.
- Separate world direction from screen direction.
- Deduplicate identical sources, then number their placeholders by media type and first appearance: `@image1...`, `@video1...`, `@audio1...`.
- Keep paths, filenames, URLs, upload labels, and platform-native IDs out of the formal prompt.

### 3. Apply Confirmed Facts

Use only the confirmed facts in `references/model/capability-registry.yaml`:

- one generated segment is `4-30s`;
- image, video, and audio references together are at most `50`;
- the first and last `0.5s` are stability zones;
- exact dialogue is `角色ID说{逐字台词}` and narration is `旁白{逐字旁白}`.

Do not invent platform weights, token or character budgets, camera-control switches, separate negative fields, or guarantees.

### 4. Build the Segment Prompt

Use the native output order in `references/model/nine-layer-schema.md`:

1. `【通用约束栏 · 本 segment 共享】` with only the useful current-segment rows, led by `素材绑定` and `光影色彩风格`; add separate `角色外观` or `场景外观` rows only when the segment needs them.
2. `【本段戏剧任务】正文` on the same line as its heading. Compile the L1 `objective/turn/audience_landing` into one causal sentence: the character's original situation becomes a new situation through an explicit action or turn, followed by the relationship, emotional, or next-action result the audience should understand or feel at the end.
3. `【本段情节】正文` with a plain-language start-to-end summary of this segment only, also on the heading line.
4. Ordered `【镜头N】| M:SS-M:SS` blocks.
5. `【收尾约束】正文` with the final stable state and any confirmed end constraints on the same line.

The prompt is self-contained at the segment level. Do not print other segment names, cross-segment IDs, internal lock names, review notes, or process commentary. Continuity is expressed as visible opening and closing states, not as a separate transition card.

### 5. Write Each Shot

For every shot, write the original native block:

1. an optional cut declaration and one short technical declaration containing shot size, lens, tilt, and camera position;
2. one natural-language paragraph in the order the viewer perceives it:
   - establish foreground, middle ground, background, and left/right placement;
   - show the action from initiation through process to result, with performance, reaction, and information change;
   - place exact dialogue or narration and synchronized sound at the moment they occur;
   - write camera movement and focus handoff when they happen, then land the ending composition and focus.

The common camera/texture baseline is stated once in the `光影色彩风格` row; repeat it in a shot only when it changes. Do not turn the technical declaration into a long parameter list.

Action contracts are woven into the shot paragraph: intention -> path -> contact -> force/inertia -> feedback -> resulting state. Do not add an action appendix or a second prompt format.

### 6. Keep the Prompt Lean

Remove repeated adjectives, duplicated scene facts, internal labels, and decorative technical values. Keep every fact that controls identity, count, space, causality, performance, sound, dialogue, or continuity. There is no character-count quota, shot-count quota, mandatory field count, or formal self-check section.

## Dialogue Compilation

Braces contain spoken text only:

```text
父亲看向女儿，停一拍后说{门没有锁，是我们一直没推。}
旁白{那天以后，钟再也没有走过。}
```

Put delivery, mouth visibility, emotion, timing, position, sound source, and listener response outside the braces. Preserve every character and punctuation mark inside braces unless the user revises the line. An off-screen line states that its voice is off-screen and does not bind to a visible mouth.

Use `<具体音效>` for a point sound embedded at its moment, and `（背景播放具体音乐）` for music when the project calls for it. Keep continuous ambience in the shared `光影色彩风格` row or in the shot prose where it changes.

## Asset Compilation

All image, video, and audio references count together. Place the references in one natural-language row in the common section:

```text
─ 素材绑定：@image1=父亲参考图（外观与服装）· @image2=夜街场景图（空间与光色）· @video1=起身动作参考（起身与转身节奏）
```

1. Deduplicate the physical sources before numbering.
2. Number each media type contiguously from 1 in first-use order.
3. Give each placeholder a semantic name and a short description of what it contributes.
4. Put every unique placeholder exactly once on the `素材绑定` row; merge its duties and scope there.
5. In every shot, use the semantic name rather than repeating `@imageN`, `@videoN`, or `@audioN`.

When there are no reference assets, omit the `素材绑定` row entirely. Do not print an empty row or a sentence saying that the segment has no assets.

A reference image defines only its declared object, a motion reference defines only its declared movement or camera relation, and a voice reference defines only its declared sound qualities. None silently adds a person, prop, voice, or setting.

## Output Discipline

For a full compilation, output one complete native shot prompt per segment inside its own fenced code block so line breaks remain copyable, and end the prompt at `【收尾约束】`. Keep segment-wide exclusions and tail-state constraints in that final block rather than scattering them across shots. Do not append a self-check, score, report, read log, capability essay, or rationale. For `OPTIMIZE`, preserve the locked shot design and return the complete revised prompt unless the user requests one replacement block. For `DIAGNOSE`, follow `modules/diagnosis.md` and return the smallest affected prompt block.
