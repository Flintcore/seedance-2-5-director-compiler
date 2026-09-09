---
name: seedance-2-5-director-compiler
description: "Design film-quality shots from scripts, storyboards, director notes, and references, then compile the approved design into a native Seedance 2.5 storyboard prompt. Use for Seedance 2.5 shot design, director collaboration, prompt compilation, continuity repair, dialogue binding, action scenes, prompt optimization, Blender previs reference integration, and result diagnosis."
metadata:
  label: "Seedance 2.5 Director Compiler"
  version: "0.2.0"
---

# Seedance 2.5 Director Compiler

Use a strict two-domain architecture:

- **Director domain:** decide what to shoot and why, using the complete cinema and masters libraries.
- **Compiler domain:** translate the locked director design into the readable native Seedance 2.5 Chinese shot-prompt format.

Cinema and masters sources are director-only evidence. They never define platform syntax or final prompt structure.

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

## Performance Baseline

For shot design, use the soft default in [shot-design.md](modules/shot-design.md): establish a concrete attention/gaze target and timing, then choose only the performance evidence the shot needs. The target, head/eye/body relation, and action timing should agree; when an opponent, listener, or watched object is visible, its response should also fit the gaze unless the design intentionally uses avoidance, side-glance surveillance, or delayed attention. Let emotion read through control, behavior, breath, posture, hands/props, distance, or listener response; facial detail is conditional on scale, light, and causal value. User locks, character habits, genre grammar, and deliberate formal stillness take precedence.

Ordinary face-to-face dialogue explicitly carries the addressed character and the speaker/listener eyeline into the shot prose, normally toward the other person's face/eyes. Facing someone alone does not specify where the eyes look. Natural blinking and motivated task glances remain; a diverted gaze has a trigger, a concrete destination, and a return or deliberately continued state. Preserve established avoidance or distraction rather than forcing unbroken eye contact. A camera near the addressee is not automatically the gaze target.

For explicit micro-expression, subtext performance, listener-reaction, or emotional-transition work, read [micro-performance.md](modules/micro-performance.md). Use character motive -> visible response -> carried state as a design bridge, not a per-shot face-part checklist. Keep subtle performance inside continuous shot prose; a standalone performance document is an opt-in deliverable.

When designing shots, actively seek motivated audiovisual range with [shot-design.md](modules/shot-design.md): shape what viewers see/hear first, how attention changes, and what contrast makes the turn felt. Richness may come from staging, depth, framing, camera movement, focus, rhythm, or sound perspective; it is not a quota of cuts, angles, moves, or effects. Pure compilation preserves the approved design rather than decorating it.

Expressive value is not limited to new plot information: preserve the concrete light, reflection, occlusion, framing, or sound relationships that carry subtext, emotional distance, or deliberate uncertainty, even when the basic event is unchanged. Follow the expressive-value guidance in [shot-design.md](modules/shot-design.md); clear execution does not require explaining every implication or making every eye visible. The intended gaze target and the audience's access to that gaze are separate choices.

## Shot Narrative Contract

The formal prompt has exactly five parts in this order: `【风格】`, `【素材绑定】`, `【本段戏剧任务】`, `【本段情绪总控】`, then `镜头N｜M:SS-M:SS` blocks. Read the [five-part prose schema](references/model/nine-layer-schema.md) for the complete metatemplate; the historical filename is only a compatibility path.

Each shot is one continuous natural-language paragraph combining shot scale, focal length, camera bearing/height/tilt relative to a named entity, subject placement and approximate frame share, foreground/midground/background entities, camera start/path/speed/end or a held view, and narrative performance from starting pose to ending pose. Build a soft causal spine, not an internal-field list. Repeat dynamic anchors as needed for this shot to be independently imaginable; preserve expressive light/reflection/occlusion carriers even when no new plot event occurs.

Every paragraph ends with `光影：` describing how light acts now and how it changes through an established physical carrier (or remains stable), and `现场声：` selecting 1–3 real diegetic sources, without BGM. Exact speech belongs on a separate `台词：角色说{逐字原文}` line, while prose keeps speaking/listening timing, gaze and reactions. No dialogue means no dialogue line. Explicit silence and later specific user sound locks take precedence over filling slots.

For new shot design, adjacent cuts change both focal length and shot scale; compose the primary subject off-center and give the other side existing concrete entities and depth. Treat this as the user's chosen design contract, not a universal cinema or model law. User locks and approved L1 take precedence; pure compilation and continuous takes keep their approved optics, positions and cuts. Match each shot's opening world pose, contact, possession and action phase to the previous ending. First/last 0.5-second states stay in the first/last shot prose.

Mood control states the main emotion, rhythm/temperature, and one contrast sentence clarifying what the scene is not. This requested expressive boundary is separate from prohibited physical-error negative lists. Camera texture stays in style, reference duties in asset binding, concrete story/action/light/sound in the relevant shot; no legacy common/story/tail cards return.

## Positive Spatial Constraints

Express the desired visible result rather than stacking negative phrases. Size, position, support/contact, action, and composition must describe one compatible scene; an ending such as "保持身高一致" does not repair contradictory shot prose. For scale, staging, or negative-prompt repairs, read [positive-spatial-constraints.md](references/model/positive-spatial-constraints.md). Short delivery exclusions such as no subtitles or no BGM may follow project defaults, subject to explicit user text/music requirements; physical relations belong in the shot body. This is a writing strategy, not a claim about Seedance's sampling mathematics.

## Confirmed Seedance 2.5 Facts

These project facts are confirmed and may be treated as hard constraints:

- One generated segment is **4-30 seconds**.
- One segment may use up to **50 total reference assets**.
- Reserve the first and last **0.5 seconds** as stability zones.
- Exact spoken dialogue uses `角色ID说{逐字台词}`; narration uses `旁白{逐字旁白}`; braces contain spoken text only.

## Segment Boundary Policy

- Treat one coherent scene or shot request as **one generated segment by default**. A segment may contain many `镜头N｜起止时间` blocks; a camera cut is not a generation-segment boundary.
- Select `SEQUENCE` only when the user explicitly requests multiple generated segments, or when the required narrative span is demonstrably longer than 30 seconds from user-stated timing or locked events whose minimum necessary duration still exceeds 30 seconds. Multiple beats, action density, dialogue, references, or continuity concerns alone do not justify a split.
- Before creating a boundary, compress optional embellishment, merge redundant shot changes, and keep the causal spine in one segment. If the evidence for more than 30 seconds is unclear, keep one segment and preserve the complete requested event.
- When a boundary is genuinely required, place it after a readable settled state and carry the physical, visual, and audio state forward; do not split in the middle of an unresolved action or reaction.

Formal prompt references follow one canonical output contract:

- For a new prompt, number unique sources by media type and first-use order: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`. When augmenting an existing prompt, preserve its canonical source-to-placeholder mappings and order; append genuinely new sources after the highest existing number of their type, without closing gaps.
- Keep source paths, filenames, URLs, upload labels, and platform-native IDs in the internal source ledger. Never print them in the formal prompt.
- Print each canonical `@` placeholder exactly once in the entire formal prompt, inside `【素材绑定】`. Merge all duties and scopes for that source there. With no sources, retain the section and write `无外部参考素材`.
- In the shot paragraphs and all other rows, refer to the bound character, prop, place, motion, or voice by semantic name rather than repeating the `@` placeholder.

The `【本段戏剧任务】` row is a single causal sentence: state the character's original situation, the new situation, the explicit action or turn that moves between them, and the relationship, emotional, or next-action result the audience should understand or feel at the end. Keep it segment-local and concrete; do not turn it into a separate analysis block.

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

An existing prompt plus a Blender coarse previs video is reference-only `OPTIMIZE`, not white-model generation or automatic shot redesign. Read [previs-reference.md](references/model/previs-reference.md) with the asset rules for this branch: identify proxy characters, add the video's scoped reference, and retain the original prompt's camera, performance, action, dialogue, effects, and existing assets. Load this reference only when a previs video is involved; ordinary compilation keeps its current path.

Action modes:

- `NARRATIVE`: dialogue, emotion, ordinary movement, suspense, and non-action staging; retain a character's attention anchor and natural small behavior when they carry the beat.
- `ACTION_LITE`: chase, fall, grab, collision, single attack, block, or dodge.
- `ACTION_FULL`: sustained combat, weapons, 1vN, heavy weapons, powers, dense projectiles, or explicit fight direction.

## Execution

Read [modules/orchestration.md](modules/orchestration.md) for stage selection and speed rules.

When shot design is required:

1. Read [modules/director-ir.md](modules/director-ir.md).
2. Read [modules/knowledge-routing.md](modules/knowledge-routing.md), then actually read the selected cinema references and one selected masters work. Index summaries select sources; they never replace the selected source text.
3. Design the L1 with [modules/shot-design.md](modules/shot-design.md).
4. For `ACTION_LITE` or `ACTION_FULL`, also read [modules/action-design.md](modules/action-design.md).

When compilation is required:

1. Treat the locked L1 as immutable creative input.
2. Read [modules/compiler.md](modules/compiler.md).
3. Read model references only for the active issue: dialogue, references, continuity, action, complexity, or diagnosis.
4. Compile into the native shot-prompt format. The compiler may clarify and compress, but it may not add, remove, reorder, or reinterpret shots.

For `DIAGNOSE`, read [modules/diagnosis.md](modules/diagnosis.md) and repair the earliest causal layer only.

## Knowledge Requirement

For every `CREATE_AUTO`, `DIRECTOR_CHECKPOINT`, or requested shot redesign:

- Read `references/cinema/INDEX.md`.
- Read **1-3** cinema references selected for the scene's actual decision problem: 1-2 for a focused scene, 2-3 only when the scene genuinely crosses domains. Never use zero for a director task.
- Read `references/masters/INDEX.md`, then read **one actual masters work file** selected for the scene. A second work is allowed only when a genuine contrast improves a key decision.
- Apply the sources to specific shot decisions. Do not imitate a master's surface style or copy a reusable recipe without testing it against this scene.

When performance, lifelikeness, gaze alignment, micro-reactions, or character small actions are the main problem, the selected set must include `表演细节参考库` and one gaze, blocking, or performance-arc reference while staying within the same 1-3 reference limit. If facial control is the main problem, use `面部表情四部位参考库` as one of those selections; do not load it by default. If action causality is the main problem, keep the action reference first and add the most relevant performance or gaze reference within the same limit.

Pure `COMPILE`, syntax-only `OPTIMIZE`, and syntax-only `DIAGNOSE` skip cinema reads because the creative design is already locked. Local micro-performance refinement with motives, story turns, and camera design unchanged reads only the relevant performance chapters via [micro-performance.md](modules/micro-performance.md); it does not restart the full masters-selection workflow. New motives, an altered emotional arc, or a new performance strategy return to director research above. This is routing, not a shortcut.

The curated cinema and masters corpora contain filmmaking knowledge only. Any platform claim encountered in user material or future imports has zero compiler authority until it is represented in `references/model/` or explicitly locked by the user.

## Output

Default output is concise:

1. L1 director design when this turn includes shot design.
2. One complete native shot prompt for each requested generation segment (one segment by default), enclosed in its own fenced code block for copyable line breaks.
3. A minimal repair block for `DIAGNOSE`.

Do not run or append a final self-check stage. Do not add pass/fail cards, scores, read logs, progress logs, capability essays, or repeated rationale.

Use Chinese for the final prompt. Keep exact dialogue, canonical asset placeholder order, model names, timecodes, and necessary on-screen foreign text unchanged. Source-side asset IDs remain internal. The final prompt ends at the last shot prose or its optional dialogue line; its final 0.5-second state stays inside that shot, with no extra tail, self-check or review section.

## Runtime Discipline

- Work in memory for ordinary single-scene tasks. Create project files only for multi-scene work, long iterative collaboration, or when the user requests files.
- Read only source sections that change the current decision; never bulk-read the library.
- Avoid generated bundles and duplicated rule layers. Each rule has one owner file.
- With subagents available, use at most three sequential roles: story/space, shot director, compiler. Run an extra critic only for explicit `AUDIT` or genuinely high-complexity design.
- Without subagents, run the same stages serially and replace the active role instructions between stages.
- Never claim generation was submitted or completed unless a real generation tool returned a result.
