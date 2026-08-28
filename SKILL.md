---
name: seedance-2-5-director-compiler
description: "Design film-quality shots from scripts, storyboards, director notes, and references, then compile the approved design into a native Seedance 2.5 storyboard prompt. Use for Seedance 2.5 shot design, director collaboration, prompt compilation, multi-clip continuity, dialogue binding, action scenes, prompt optimization, and result diagnosis."
metadata:
  label: "Seedance 2.5 Director Compiler"
  version: "0.1.4"
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

## Confirmed Seedance 2.5 Facts

These project facts are confirmed and may be treated as hard constraints:

- One generated segment is **4-30 seconds**.
- One segment may use up to **50 total reference assets**.
- Reserve the first and last **0.5 seconds** as stability zones.
- Exact spoken dialogue uses `角色ID说{逐字台词}`; narration uses `旁白{逐字旁白}`; braces contain spoken text only.

Formal prompt references follow one canonical output contract:

- Number unique sources by media type and first-use order: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`.
- Keep source paths, filenames, URLs, upload labels, and platform-native IDs in the internal source ledger. Never print them in the formal prompt.
- Print each canonical `@` placeholder exactly once in the entire formal prompt, on the `─ 素材绑定：` row inside `【通用约束栏 · 本 segment 共享】`. Merge all duties and scopes for that source into that row.
- In the shot paragraphs and all other rows, refer to the bound character, prop, place, motion, or voice by semantic name rather than repeating the `@` placeholder.

The `【本段戏剧任务】` row is a single causal sentence: state the character's original situation, the new situation, the explicit action or turn that moves between them, and the relationship, emotional, or next-action result the audience should understand or feel at the end. Keep it segment-local and concrete; do not turn it into a separate analysis block.

Do not invent additional numeric platform limits, reference weights, control fields, or guaranteed behaviors. Read `references/model/capability-registry.yaml` when a platform capability affects the answer.

## Route

Choose one task mode and one action mode.

Task modes:

- `CREATE_AUTO`: design L1 and compile the matching prompt in one pass.
- `DIRECTOR_CHECKPOINT`: deliver L1 first; compile only after the user approves or revises it.
- `COMPILE`: translate an existing locked shot list or approved L1 without redesigning it.
- `SEQUENCE`: design or compile multiple segments with explicit entry/exit continuity.
- `OPTIMIZE`: preserve the existing creative design and improve the prompt only.
- `DIAGNOSE`: trace an observed result to the earliest cause and return a minimal replacement block.
- `AUDIT`: review only when the user explicitly asks for review or audit.

Action modes:

- `NARRATIVE`: dialogue, emotion, ordinary movement, suspense, and non-action staging.
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

`COMPILE`, prompt-only `OPTIMIZE`, and syntax-only `DIAGNOSE` skip cinema reads because the creative design is already locked. This is routing, not a shortcut.

The curated cinema and masters corpora contain filmmaking knowledge only. Any platform claim encountered in user material or future imports has zero compiler authority until it is represented in `references/model/` or explicitly locked by the user.

## Output

Default output is concise:

1. L1 director design when this turn includes shot design.
2. One complete native shot prompt per segment when compilation is requested, enclosed in its own fenced code block for copyable line breaks.
3. A minimal repair block for `DIAGNOSE`.

Do not run or append a final self-check stage. Do not add pass/fail cards, scores, read logs, progress logs, capability essays, or repeated rationale.

Use Chinese for the final prompt. Keep exact dialogue, canonical asset placeholder order, model names, timecodes, and necessary on-screen foreign text unchanged. Source-side asset IDs remain internal. The final prompt ends at `【收尾约束】`; it has no self-check or review section.

## Runtime Discipline

- Work in memory for ordinary single-scene tasks. Create project files only for multi-scene work, long iterative collaboration, or when the user requests files.
- Read only source sections that change the current decision; never bulk-read the library.
- Avoid generated bundles and duplicated rule layers. Each rule has one owner file.
- With subagents available, use at most three sequential roles: story/space, shot director, compiler. Run an extra critic only for explicit `AUDIT` or genuinely high-complexity design.
- Without subagents, run the same stages serially and replace the active role instructions between stages.
- Never claim generation was submitted or completed unless a real generation tool returned a result.
