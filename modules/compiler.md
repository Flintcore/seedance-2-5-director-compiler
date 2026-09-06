# Native Shot Prompt Compiler

The compiler translates a locked L1 director design into a self-contained Seedance 2.5 shot prompt. It preserves the director's choices and writes them in the readable format used by `seedance-agent-2-5`; it is not a second director.

Read `references/model/INDEX.md`, then load only the model references needed for the active issue. For every full prompt, read `references/model/nine-layer-schema.md` and `references/model/capability-registry.yaml`. The schema filename is retained for compatibility; its contents define the native shot format.

## Input Contract

Accept any combination of:

- an approved L1 director design or an existing locked shot list;
- an existing final prompt to augment without rebuilding L1; when adding a Blender coarse previs video, read [previs-reference.md](../references/model/previs-reference.md);
- user locks, exact story facts, exact dialogue, and world rules;
- the current segment duration and, when relevant, its physical boundary state;
- asset source locators, media types, and the intended responsibility of each asset;
- an internal action contract from `action-design.md`.

Treat user locks and approved L1 as immutable creative input. The compiler may make relationships explicit, assign stable semantic IDs, divide time within the locked generation segment, and remove only semantically duplicated static wording. It must preserve shot order, performance, action, outcome, aesthetics, and any attention/gaze anchor or performance-bearing small behavior that controls the shot's meaning. Dynamic spatial relations, action phase, reactions, and transition causes remain available wherever they are needed to reconstruct the current frame. A missing operational value is filled with the least-committal choice supported by the locked facts; unresolved creative uncertainty stays outside the formal prompt.

The compiler does not create a new generation segment for a coherent scene. It compiles the supplied segment as one prompt unless a multi-segment boundary is explicitly requested or already justified by the boundary policy; all camera cuts and beats remain inside that prompt.

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
- Deduplicate identical sources and follow the numbering policy in [reference-assets.md](../references/model/reference-assets.md): initialize new prompts by media type and first appearance; preserve existing canonical source bindings when augmenting a prompt.
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

The prompt is self-contained at the segment level, and each shot block is independently readable enough to reconstruct its current visual event. Do not print other segment names, cross-segment IDs, internal lock names, review notes, or process commentary. Continuity is expressed as visible opening and closing states, not as a separate transition card.

### Shot-Level Continuous Visual Narrative

Treat each shot block as a continuous visual event rather than a field-by-field transcription. Form the causal spine before prose compilation, then weave the available L1 fields into one paragraph in this soft order:

`current composition and spatial relation -> trigger -> action process -> linked reaction -> dialogue or sound at its moment -> camera/focus response -> result, ending composition, and next cut`

The order is a writing aid, not a quota. Present a trigger, action, or reaction only when the locked L1 contains that event; for an observing, held, or purely continuous shot, describe the active state, attention, and tension that are actually present without inventing a new event. A shot paragraph should let a reader answer, from that block alone, who is where, what each visible subject is attending to, what caused the change when a change occurs, how the action unfolds when action is present, how the surrounding subjects respond, and what state remains at the end. Keep the common rows as navigation; the concrete action, reaction, dialogue placement, spatial relationship, and cut/continuation reason belong in the shot body. Repeat dynamic anchors when a cut or focus change would otherwise erase the frame from working memory; compress only stable static facts that have no effect on this shot's comprehension.

When the same space or camera continues, connect internal beats with natural temporal clauses such as "此时", "同时", "看到后", "就在这时", and "随后". A held or observational shot may explicitly state that the action, sound, or attention continues and that there is no new cut; it does not need a manufactured event. When a cut occurs, state the outgoing result and the first visible state after the cut so the new view has an explicit cause and landing point.

写法示意（只示范信息织合，不是固定句式）：35mm三人中景，摄影机位于宋佳正面、与她眼睛等高，平视并保持固定。画面中宋佳居中、粑粑在右侧、大胃袋在左侧；宋佳先看向粑粑，看到它后退半步便伸手把它挡回队伍，同时锅巴在她头顶探身看热闹。宋佳说{回到原位}，大胃袋收住脚步，焦点随宋佳的手带到粑粑脸上，最后停在三人重新形成的关系上，为下一次视线转移留下明确起点。

### 5. Write Each Shot

For every shot, write the original native block:

1. an optional cut declaration and one short technical sentence containing shot size, focal length, camera position relative to a named character/place/object (horizontal bearing and height), viewing tilt (level/up/down), and movement or a fixed camera; movement may continue in the event prose at its actual moment;
2. one natural-language paragraph that reconstructs the shot as a visible causal event in the order the viewer perceives it:
   - establish the current composition, foreground/middle/background, left/right placement, and attention relations;
   - show the trigger and action from initiation through process to result, including performance, linked reactions, and information change;
   - place exact dialogue or narration and synchronized sound at the moment they occur;
   - write camera movement and focus handoff as responses to the event, then land the ending composition, focus, and next-cut state.

Apply the complete-shot requirements in [nine-layer-schema.md](../references/model/nine-layer-schema.md). Keep each shot's camera information locally readable even for a continued setup or previs-assisted prompt; distinguish camera height from viewing tilt. Shared image texture, capture medium, and light/color baseline may stay in `光影色彩风格`, but they do not replace shot-local size, focal length, position, angle, and movement. This is a compact technical sentence plus continuous performance, not a field list or a new output format.

Action contracts are woven into the shot paragraph: intention -> path -> contact -> force/inertia -> feedback -> resulting state. Do not add an action appendix or a second prompt format.

### 表演连续性

压缩提示词时保留已锁定的注意力/视线锚点和承担意义的表演证据；按景别编译为姿态、距离、手/物件、呼吸或反应等自然语言，不补造动作，也不把微表情拆成部位清单。把表演的触发、可见变化和反应结果放在同一条镜头因果叙事里，避免悬空成独立标签。连续性承接的是注意力、控制、呼吸与重心轨迹，小动作只在自然持续或再次触发时延续；有意静止仍写清目标或张力。`COMPILE` 只保留既有证据，不为满足基线另造手势。

### 6. Keep the Prompt Lean

Remove repeated adjectives, semantically duplicated static scene facts, internal labels, and decorative technical values; the complete-shot camera information above is useful content, not decoration. Keep every dynamic or static fact that controls identity, count, space, causality, performance, sound, dialogue, or continuity; a repeated spatial or action anchor is useful when it restores shot-level comprehension. There is no character-count quota, shot-count quota, mandatory output field count, or formal self-check section.

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

1. Deduplicate the physical sources before numbering; a previously bound video gains duties on its existing binding rather than a second placeholder.
2. Follow `reference-assets.md`: new prompts start each media type at 1; reference augmentation preserves existing canonical numbers and order, appending new sources after that type's highest number.
3. Give each placeholder a semantic name and a short description of what it contributes.
4. Put every unique placeholder exactly once on the `素材绑定` row; merge its duties and scope there.
5. In every shot, use the semantic name rather than repeating `@imageN`, `@videoN`, or `@audioN`.

When there are no reference assets, omit the `素材绑定` row entirely. Do not print an empty row or a sentence saying that the segment has no assets.

A reference image defines only its declared object, a motion reference defines only its declared movement or camera relation, and a voice reference defines only its declared sound qualities. None silently adds a person, prop, voice, or setting.

For a Blender coarse previs video, use the narrower duties in [previs-reference.md](../references/model/previs-reference.md), not an automatic exact-motion or rhythm lock. The reference supplements the existing shot paragraphs; it does not replace their camera prose, continuous story, performance, action detail, or effects with an instruction to follow the video.

## Output Discipline

For a full compilation, output one complete native shot prompt for each explicitly requested or boundary-justified generation segment inside its own fenced code block so line breaks remain copyable; ordinary single-scene input produces one block. Multiple camera shots, cuts, and action beats inside one locked `4-30s` scene remain in that one prompt; do not turn each shot into a separate generated segment. End each prompt at `【收尾约束】`. Keep segment-wide exclusions and tail-state constraints in that final block rather than scattering them across shots. Do not append a self-check, score, report, read log, capability essay, or rationale. For `OPTIMIZE`, preserve the locked shot design and return the complete revised prompt unless the user requests one replacement block. For `DIAGNOSE`, follow `modules/diagnosis.md` and return the smallest affected prompt block.
