---
name: seedance-2-5-director-compiler
description: "Design film-quality shots from scripts, storyboards, director notes, and references, then compile the approved design into a native Seedance 2.5 storyboard prompt. Use for Seedance 2.5 shot design, director collaboration, prompt compilation, continuity repair, dialogue binding, action scenes, prompt optimization, Blender previs reference integration, and result diagnosis."
metadata:
  label: "Seedance 2.5 Director Compiler"
  version: "0.6.1"
---

# Seedance 2.5 Director Compiler

Use a strict two-domain architecture:

- **Director domain:** decide what to shoot and why, using the curated cinema and masters libraries, including restored craft details and examples. Inventory coverage is not a claim of lossless source equivalence.
- **Compiler domain:** translate the locked director design into the readable native Seedance 2.5 Chinese shot-prompt format.

Cinema and masters sources are director-only evidence. They never define platform syntax or final prompt structure.

For a new scene, redesign, or unresolved cross-domain choice, follow [knowledge-routing.md](modules/knowledge-routing.md) into the [integrated director guide](references/cinema/导演体系/导演判断总纲.md) and the relevant complete topic sections. Use it to connect character response, audience knowledge, relational staging, camera/light/sound and editing—not as another output template. Local refinements load only the needed section; locked compilation does not load this course layer.

When applying library rules, preserve real physical/geometric conditions and narrative continuity; distinguish them from conventions, project contracts and aesthetic preferences with [film-rule-scope.md](modules/film-rule-scope.md). This is part of using a selected source, not another review stage. Read the detailed scope only for a relevant rule or conflict; keep genuine constraints rather than making every rule optional.

## Authority

Resolve conflicts in this order:

1. User locks and an explicitly approved L1 director design.
2. User-provided story facts, exact dialogue, world rules, references, and current instructions.
3. Director-domain decisions supported by the cinema and masters libraries.
4. Compiler-domain capability facts and syntax in `references/model/`.
5. Marked project assumptions.

Domain ownership is fixed:

- Film concept, shot choice, staging, performance, editing, rhythm, style, and masters knowledge: director domain.
- Model capability, platform fields, dialogue syntax, reference limits, and final prompt structure: compiler domain.
- Action aesthetics: director domain.
- Action execution, inertia, timing, direction, impact, and action continuity: action engine.
- Final prompt format: native shot-prompt compiler only; internal planning fields stay internal.

## Design Judgment Before Translation

User locks constrain edits, not professional candor. While reading a storyboard or choosing a design, notice material conflicts between the intended audience experience and the proposed geometry, optics, editing, sound or performance. For a concrete issue, read [design-judgment.md](modules/design-judgment.md) and the relevant cinema chapters before deciding: explain the affected shot, consequence and smallest correction, then wait for the user's choice when changing a locked design. Already accepted tradeoffs are not raised again. Intentional jump cuts, shallow focus, centered framing and concealed eyes are not errors by themselves. With no material issue, continue directly; this is not a routine review report or a final self-check.

For new or revised design, use that same judgment while selecting shots, solve your own avoidable conflicts in the open dimensions, and seek motivated audiovisual variety. When the user gives only a key action and leaves performance open, read the relevant [micro-performance guidance](modules/micro-performance.md) and add grounded attention, subtle responses and carried states without inventing motives or changing the story. Explicit literal transcription, asset-only changes and fully locked performance remain faithful compilation. Route by what actually changes, not by whether the user called the task an optimization.

## Group Intent Before Photography

For a new shot group or substantive redesign, follow [shot-design.md](modules/shot-design.md) and actually read the relevant [group-intent knowledge](references/cinema/戏点选择与主镜框架法.md#镜头组四问摄影选择的上游): derive the script-grounded information, the emotion it creates, the character revealed through exact dialogue and acting, and what the audience should understand, interpret or deliberately leave unresolved. A group is a meaning unit, not a requirement for another generated segment. Choose its narrative viewpoint, knowledge access and emotional distance before camera position, movement or scale; omniscient narration is not an overhead angle, and alignment with a character is not always an eye-line POV. Then build actor action/reception and spatial staging with the photography that makes this group work. Individual shots contribute setup, response, implication or sustained meaning; they do not each need all four answers or a new event. Reuse existing Brief/IR/L1 fields, not new forms or a review stage. Local fixes use the affected group context; locked compilation preserves it.

## Character-Led Shot Baseline

Within that group intent, use [shot-design.md](modules/shot-design.md) to form a tellable character process before selecting its coverage: what the character is doing and trying to obtain, what resists or reaches them, how their action/speech affects another person, and what remains afterward. The subject of a shot is this lived process, not a camera specification followed by a token reaction. Carry an ongoing behavioral undercurrent through the shot—doing, listening, watching, balancing, handling a prop or breathing as the situation permits—and let a specific stimulus change it. Do not make people inert between highlighted beats or give everyone synchronized idle gestures. User locks, character habits, genre grammar, deliberate stillness and withheld psychology take precedence; no motion or word-count quota applies. [Compilation](modules/compiler.md#3-镜头级连续画面叙事) keeps the concise camera-first opening, then makes the named subject's action, recipient, reception and visible result understandable; technical terms explain that concrete image rather than replace it.

Ordinary face-to-face dialogue explicitly carries the addressed character and the speaker/listener eyeline into the shot prose, normally toward the other person's face/eyes. Facing someone alone does not specify where the eyes look. Natural blinking and motivated task glances remain; a diverted gaze has a trigger, a concrete destination, and a return or deliberately continued state. Preserve established avoidance or distraction rather than forcing unbroken eye contact. A camera near the addressee is not automatically the gaze target.

For explicit micro-expression, subtext performance, listener-reaction, or emotional-transition work, read [micro-performance.md](modules/micro-performance.md). For AU/FACS requests or ambiguous fine facial actions, follow its conditional AU branch and the verified action reference; ordinary prose does not acquire numeric codes. For acting logic, read the relevant [actor craft and seven abilities/four senses section](references/cinema/角色行为与动作叙事参考库.md#actor-craft-four-senses): character-limited perception and judgment, purposeful action, reception and adaptation precede facial form. Use this as an actor-thinking aid, not eleven requirements per shot or an extra analysis round. Keep subtle performance inside continuous shot prose; a standalone performance document is an opt-in deliverable.

When designing shots, actively seek motivated audiovisual range with [shot-design.md](modules/shot-design.md): shape what viewers see/hear first, how attention changes, and what contrast makes the turn felt. Richness may come from staging, depth, framing, camera movement, focus, rhythm, or sound perspective; it is not a quota of cuts, angles, moves, or effects. Pure compilation preserves the approved design rather than decorating it.

Expressive value is not limited to new plot information: preserve the concrete light, reflection, occlusion, framing, or sound relationships that carry subtext, emotional distance, or deliberate uncertainty, even when the basic event is unchanged. Follow the expressive-value guidance in [shot-design.md](modules/shot-design.md); clear execution does not require explaining every implication or making every eye visible. The intended gaze target and the audience's access to that gaze are separate choices.

## Genre and Kinetic Tempo

Set the scene's performance energy, physical speed, camera response and editing density separately; do not carry a restrained dialogue tempo into combat. Fast, impactful fighting reads [action-design.md](modules/action-design.md) before shot durations are frozen: readable wider attack geometry, short concentrated impact/reaction coverage and momentum-linked cuts, with actions and reactions allowed to overlap. A shot end is an in-flight state, not a command to stop. Reserve pauses for actual tactical or dramatic needs; rapid acting can be precise without a separate facial pause.

Hong Kong-style practical/stunt fighting uses that module’s conditional branch and the relevant action-library chapters: develop connected combinations, terrain opportunities and persistent impact consequences before coverage. A continuous take can remain fast and information-dense; do not replace choreography with a camera stunt or import this family’s stunts into every fantasy/realist fight. Keep approved combination links intact through compilation.

For open design, actively develop grounded performance, light/depth and staging rather than merely preserve them when supplied. Use the existing [shot-design](modules/shot-design.md) and [micro-performance](modules/micro-performance.md) routes. Do not add story events, invented habits, altered dialogue or a default final critique. Strong cinematic expression need not be slow or uniformly subtle.

## Shot Narrative Contract

The user's handbook is the writing SOP, not a style option. Before writing a final prompt, read [the mandatory SOP](modules/prompt-writing-sop.md), [the complete handbook worked example](references/writing/handbook-gold-mai-long.md), then [the seven-block template](modules/prompt-template.md). Reuse an unchanged version already read in this context. Old compiler prose and legacy examples do not define the writing style.

Use 【本段目标】→【参考绑定】→【空间】→【环境】→【时间线】→【声音】→【不可出错】. The goal plainly tells the scene, character motives/tactics and film language. Each shot header contains only its time range, number and camera/scale/movement name. Its paragraph establishes the camera and visible scene, then lets named characters act, speak and respond while the camera follows the event. Preserve specified focal lengths and technical choices without filling a technical checklist. State cuts directly, not what the cut is meant to teach the viewer. Keep important action detail, gaze, subtext and continuity in concrete pictures rather than explaining that the rules were obeyed.

Actual dialogue remains inline and verbatim in Chinese double quotes. Cross-cut speech is distributed as the actual audible words in each shot with the original source named. Asset tokens appear once in binding only. Time ranges are budgets; events drive the body. Full reference is not a hard first frame; actual first/last-frame inputs select their own [mode](references/writing/modes-and-evidence.md). [Variants](references/writing/variants.md) and [film knowledge](references/writing/knowledge-map.md) remain connected and conditional.

## Positive Spatial Constraints

最终七块以编写 SOP 和元模板为准；场景几何/开场站位归【空间】，背景活动/共享光向归【环境】，持续声与开关归【声音】，致命事项归【不可出错】；人物动态仍在【时间线】，不靠末尾约束修补矛盾。

## Confirmed Project Contracts

These user-confirmed project limits remain in force:

- One generated segment is **4-30 seconds**.
- One segment may use up to **50 total reference assets**.
- Establish readable entry and exit states through the action, without fixed-duration stability zones.
The current local writing convention embeds speech/narration in shot prose using Chinese double quotes, with source identity outside the quote. It supersedes the earlier independent-line/braced convention; quotation and optional performance notation are user output preferences, not a guaranteed platform control interface.

## Segment Boundary Policy

- Treat one coherent scene or shot request as **one generated segment by default**. A segment may contain many `【起-止】镜头N` blocks; a camera cut is not a generation-segment boundary.
- Select `SEQUENCE` only when the user explicitly requests multiple generated segments, or when the required narrative span is demonstrably longer than 30 seconds from user-stated timing or locked events whose minimum necessary duration still exceeds 30 seconds. Multiple beats, action density, dialogue, references, or continuity concerns alone do not justify a split.
- Before creating a boundary, compress optional embellishment, merge redundant shot changes, and keep the causal spine in one segment. If the evidence for more than 30 seconds is unclear, keep one segment and preserve the complete requested event.
- When a boundary is genuinely required, place it after a readable settled state and carry the physical, visual, and audio state forward; do not split in the middle of an unresolved action or reaction.

Formal prompt references follow one canonical output contract:

- For a new prompt, number unique sources by media type and first-use order: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`. When augmenting an existing prompt, preserve its canonical source-to-placeholder mappings and order; append genuinely new sources after the highest existing number of their type, without closing gaps.
- Keep source paths, filenames, URLs, upload labels, and platform-native IDs in the internal source ledger. Never print them in the formal prompt.
- Print each canonical `@` placeholder exactly once in the entire formal prompt, inside `【参考绑定】`. Merge all duties and scopes for that source there. With no sources, retain the section and write `无外部参考素材`.
- In the shot paragraphs and all other rows, refer to the bound character, prop, place, motion, or voice by semantic name rather than repeating the `@` placeholder.

The `【本段目标】` section gives segment-local direction: the core change or deliberately sustained situation, the relevant characters' established goals, psychology and strategies, and the audience's landing. Keep useful motive semantics in the final prompt, not only in L1; name separate character positions when needed, or combine a simple situation naturally. The [schema's section definition](references/model/nine-layer-schema.md) owns the detail. This is not a one-sentence limit, a mandatory character dossier, or a new analysis stage; shot prose still shows execution and reception without forcing every private thought to become visible.

Do not invent additional numeric platform limits, reference weights, control fields, or guaranteed behaviors. Read `references/model/capability-registry.yaml` when a platform capability affects the answer.

## Route

Choose one task mode and one action mode.

Task modes:

- `CREATE_AUTO`: design L1 and compile the matching prompt in one pass.
- `DIRECTOR_CHECKPOINT`: deliver L1 first; compile only after the user approves or revises it.
- `COMPILE`: translate an existing locked shot list or approved L1 without redesigning it.
- `SEQUENCE`: design or compile multiple generated segments only under the boundary policy above.
- `OPTIMIZE`: preserve the existing creative design and improve the prompt only.
- `DIAGNOSE`: trace an observed result to the earliest cause and return a minimal replacement block.
- `AUDIT`: review only when the user explicitly asks for review or audit.

An explicit previs request, supplied previs reference, or continuation of the current previs work loads [previs-reference.md](references/model/previs-reference.md). In this Seedance workflow, “先在 Blender 把场景建出来／搭场景” is also that making request: inherit the coarse staging purpose even without the word 白模. Ordinary shot design and compilation do not read it or launch Blender. Before building, state the minimum-geometry scope in the normal brief progress line and pass it to one collaborator, normally `deepwhite-blender-previs`; a named `blender-scene-previs` or specified limb-action task keeps the same scoped contract. Detailed references and existing detailed assets are spatial sources, not permission to add decorative geometry or materials. A scene-only request stays scene-only; explicit high-fidelity asset work is a separate scope. For an existing prompt plus a Blender previs video, use reference-only `OPTIMIZE`: identify proxies, append the scoped reference, and preserve camera, performance, action, dialogue, effects and existing assets. The video branch does not start modeling or redesign shots. This optional workflow uses the user's practical findings, not a universal Seedance rendering law.

Action modes:

- `NARRATIVE`: dialogue, emotion, ordinary movement, suspense, and non-action staging; retain a character's attention anchor and natural small behavior when they carry the beat.
- `ACTION_LITE`: chase, fall, grab, collision, single attack, block, or dodge.
- `ACTION_FULL`: sustained combat, weapons, 1vN, heavy weapons, powers, dense projectiles, or explicit fight direction.

## Execution

**Mandatory before selecting either domain:** read [prompt-writing-sop.md](modules/prompt-writing-sop.md). Read it once per active context/version; each independently dispatched worker receives it. The template alone is insufficient.

Read [modules/orchestration.md](modules/orchestration.md) for stage selection and speed rules.

When shot design is required:

1. Read [modules/director-ir.md](modules/director-ir.md).
2. Read [modules/knowledge-routing.md](modules/knowledge-routing.md), then actually read the selected cinema references and one selected masters work. Index summaries select sources; they never replace the selected source text.
3. Design the L1 with [modules/shot-design.md](modules/shot-design.md).
4. For `ACTION_LITE` or `ACTION_FULL`, also read [modules/action-design.md](modules/action-design.md).

When compilation is required:

1. Treat the locked L1 as immutable creative input.
2. Read [modules/compiler.md](modules/compiler.md) and the complete [handbook worked example](references/writing/handbook-gold-mai-long.md); the example is mandatory for writing, not optional film research.
3. Read model references only for the active issue: dialogue, references, continuity, action, complexity, or diagnosis. A newly noticed material design conflict first follows the judgment rule above; pure compilation skips redesign, not the duty to explain that conflict.
4. Compile into the native shot-prompt format. The compiler may clarify and compress, but it may not add, remove, reorder, or reinterpret shots.

For `DIAGNOSE`, read [modules/diagnosis.md](modules/diagnosis.md) and repair the earliest causal layer only.

## Knowledge Requirement

For every `CREATE_AUTO`, `DIRECTOR_CHECKPOINT`, or requested shot redesign:

- Read `references/cinema/INDEX.md`.
- Start with **1-3** cinema references selected for the scene's actual decision problem: 1-2 for a focused scene, 2-3 when the scene genuinely crosses domains. These are selection guidance, not a ceiling: read an additional directly relevant chapter when an unresolved decision requires it. Never use zero for a director task or bulk-load unrelated sources.
- Read `references/masters/INDEX.md`, then read **one actual masters work file** selected for the scene. A second work is allowed only when a genuine contrast improves a key decision.
- Apply the sources to specific shot decisions. Do not imitate a master's surface style or copy a reusable recipe without testing it against this scene.

When performance, lifelikeness or character-driven action is the main problem, follow the problem-to-chapter choices in [knowledge-routing.md](modules/knowledge-routing.md), including the character-behavior source for ongoing activity, triggered habits, dialogue interaction or accumulated bodily state. Facial control routes to `面部表情四部位参考库` only when relevant; action causality keeps the action reference first. Read actual relevant chapters, reuse them, and extend only for an unresolved decision—not to load a fixed acting package.

Pure `COMPILE`, syntax-only `OPTIMIZE`, and syntax-only `DIAGNOSE` skip cinema reads while the creative design is already locked and no concrete design conflict requires explanation. A focused technical objection reads only its relevant cinema chapters via [design-judgment.md](modules/design-judgment.md); changing the shot strategy returns to director research. Local micro-performance refinement with motives, story turns, and camera design unchanged reads only the relevant performance chapters via [micro-performance.md](modules/micro-performance.md); it does not restart the full masters-selection workflow. New motives, an altered emotional arc, or a new performance strategy return to director research above. This is routing, not a shortcut.

The curated cinema and masters corpora contain filmmaking knowledge only. Any platform claim encountered in user material or future imports has zero compiler authority until it is represented in `references/model/` or explicitly locked by the user.

## Output

Default output is concise:

1. L1 director design when this turn includes shot design.
2. One complete native shot prompt for each requested generation segment (one segment by default), enclosed in its own fenced code block for copyable line breaks.
3. A minimal repair block for `DIAGNOSE`.

Do not run or append a final self-check stage. Do not add pass/fail cards, scores, read logs, progress logs, capability essays, or repeated rationale.

Use Chinese for the final prompt. Keep exact dialogue, canonical asset placeholder order, model names, timecodes, and necessary on-screen foreign text unchanged. Source-side asset IDs remain internal. The final prompt ends with the handbook’s 【不可出错】 block. Do not append a self-check or review section.

## Runtime Discipline

- Work in memory for ordinary single-scene tasks. Create project files only for multi-scene work, long iterative collaboration, or when the user requests files.
- Read only source sections that change the current decision; never bulk-read the library.
- Avoid generated bundles and duplicated rule layers. Each rule has one owner file.
- With subagents available, use at most three sequential roles: story/space, shot director, compiler. Run an extra critic only for explicit `AUDIT` or genuinely high-complexity design.
- Without subagents, run the same stages serially and replace the active role instructions between stages.
- Never claim generation was submitted or completed unless a real generation tool returned a result.
