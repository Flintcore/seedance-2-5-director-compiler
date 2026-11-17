# Diagnosis and Minimal Repair

Use this module when the user supplies a generated result, a timestamped symptom, or an existing prompt that failed in a specific way. Diagnose from observed evidence back to the earliest incorrect contract. Repair that contract and its direct downstream expressions only.

For a material problem noticed in the user storyboard before generation, read [design-judgment.md](design-judgment.md): identify the intended effect and the conflicting design conditions, read the relevant cinema chapters, and explain the smallest correction before altering a lock. Treat this as a prospective risk, not an observed model failure. Accepted tradeoffs do not reopen automatically; no material issue means direct continuation, not a routine diagnostic card.

## Evidence Intake

Record only what the user or visible result establishes:

```yaml
diagnosis:
  symptom:
  observed_time:
  expected_state:
  observed_state:
  earliest_divergence:
  owner_layer:
  direct_dependents: []
  preserve: []
```

Do not claim a model limitation, platform behavior, or generation state that is absent from the evidence registry or result.

## Earliest-Cause Order

Trace the symptom in this order:

1. user lock or approved L1 mismatch;
2. entity ID, instance, or reference responsibility;
3. entry state, world/screen position, or continuity interface;
4. tactical cause, action path, contact, force, or timing;
5. speaking source, exact text, mouth target, or sound timing;
6. prompt translation or end constraint;
7. optional decoration.

For each related symptom chain, stop at the earliest layer that explains that chain's downstream symptoms. If the evidence shows independent causes, localize each independently and repair only its direct dependents; do not force unrelated faults into one root cause. Do not rewrite later layers independently when correcting their shared earlier cause will resolve them. Without sufficient observed evidence, state the supported mismatch or suspected cause rather than declaring a verified runtime cause.

For instruction-like prose, compare the current prompt with its actual design input before adding rules. If the design already resolves the framing, body/action relation and viewing change, repair the compiler's lost or duplicated expression. If those decisions are absent or contradictory in the design, return only the open choice to the director layer. Without the original L1 or read trace, identify the observable text defect and keep the exact runtime cause unconfirmed. Apply the [information-use boundary](prompt-writing-sop.md#scene-first-handoff): replace the faulty scene description rather than append the diagnosis as another constraint; stable offscreen facts remain valid without a repeated inventory. Structural validator success is not evidence of an executable or expressive scene.

For lighting, separate missing design, lost compilation, and a rendered result that violates an already explicit condition. If a turn or glance looks strained, compare the gaze target, head/body freedom and camera relation before adding anatomy prohibitions. Check whether a fixed source was mistranslated into a frozen facial shadow pattern or light-side-specific expression. Keep this a prompt-risk diagnosis unless the rendered evidence establishes more; do not treat one result as a model law. Trace the actual source/occlusion, subject orientation and camera viewing side to the visible planes and shadow shapes using the [lighting handoff](prompt-writing-sop.md#lighting-design-transfer). A plausible source or the words "half-lit face" do not establish that geometry. If the prompt already specifies a dark opening, more synonymous darkness prohibitions are not a demonstrated fix; identify the earliest observed deviation and keep explanations such as reference-light inheritance or sampling behavior provisional until tested. Repair only the affected relationship, preserving accepted story and dialogue.

## Symptom Routing

| Symptom | Inspect first | Typical direct repair |
|---|---|---|
| wrong face, duplicate character, extra prop | identity facts, instance ledger, asset responsibility | stabilize ID/count and narrow asset scope |
| teleport, reversed direction, pose reset | entry state, direction map, prior exit | replace boundary state and affected first beat |
| wrong scale, conflicting support, position or framing | locked dimensions, common spatial reference, depth, pose, support/contact, action and composition | read [positive-spatial-constraints.md](../references/model/positive-spatial-constraints.md); repair the incompatible positive relation rather than adding an ending prohibition |
| flat or excessive expression, unreadable listener response, emotional reset at a cut | character motive, knowledge timing, gaze target, visible channel, prior state | read [micro-performance.md](micro-performance.md); repair the affected trigger-response-transition in continuous shot prose, preserving the camera and dialogue locks |
| wandering gaze during dialogue or unintended lens contact | intended addressee, actual head/eye direction, target position, viewpoint and any motivated diversion | restore the explicit conversation eyeline in the affected shot; preserve intentional avoidance, then carry the world target through reverse views rather than appending a negative gaze constraint |
| flat audiovisual language despite complete camera parameters | audience information/attention arc, spatial layers, framing or motion contrast, sound perspective and rhythm | use the motivated audiovisual guidance in [shot-design.md](shot-design.md) for permitted director redesign; if L1 already has these choices, repair compilation rather than inventing new shots |
| night scene too bright, flat faces, invented visible lamps | approved overall light level, dark-area intent, offscreen source, visibility requirements, reference inheritance | compare the result to the actual prompt first; if the prompt invented fixtures or demanded every face/shadow/black garment remain legible, repair that design/compilation cause using [world lighting](prompt-writing-sop.md#world-lighting), not another terminal negative list; moonlight and a practical work lamp are different sources, not interchangeable cool colors |
| continuous route resembles reference but staging feels distant or static | subject-camera distance over time, frame occupancy, occlusion, receiving reactions and light-zone crossings | preserve the story and accepted route; repair only the lost relative motion or viewing endpoint rather than adding cuts, lamp-display pauses or an automatic final push-in |
| weak or weightless hit | contact pair, force vector, inertia chain | replace the affected action beat and synchronized feedback |
| unreadable 1vN action | pressure ownership, attack lines and spatial/temporal separation | restore one legible contact and the handoff to the next threat; use actual range, obstacles or imbalance to distinguish concurrent pressure, not a queue in which all other opponents wait |
| wrong speaker or moving listener mouth | speaking source, time window, mouth target | repair the inline speaking event, listener state, and human-voice mapping |
| missing or changed words | exact spoken quote after excluding performance annotations and available time | restore the spoken content and adjust surrounding timing without editing the words |
| wrong voice or imported background audio | audio asset responsibility | narrow the audio inheritance and replace the human-source mapping |
| cut discontinuity | previous exit, current entry, sound bridge | make both sides share one state vector |
| overloaded or omitted event | timeline competition | preserve locked essentials and move flexible decoration out of the block |

## Minimal Repair Output

When repair is requested, return a compact repair card followed by the exact replacement text. A consultation or audit that asks only for findings returns those findings, without an unsolicited replacement. For independent causes, keep the same compact form for each affected chain; do not add a whole-prompt review round:

```text
症状：{timestamp + observable mismatch}
最早失配/疑似根因：{one supported cause and its owner layer for this symptom chain}
只修改：{named layer/block and direct dependents}
严格保留：{already correct locks and blocks}

【替换区块：{layer/block name}】
{complete replacement text ready to paste}
```

When the error is structural across the whole prompt, return the complete corrected native shot prompt. Otherwise, do not regenerate unaffected blocks.

The repair card is diagnostic output outside the platform prompt. Keep it limited to symptom, earliest cause, change scope, preserved facts, and replacement text.

## Action Repair

For an action symptom, reconstruct only the affected causal link:

```text
start state -> intention -> path -> contact -> force/inertia -> feedback -> resulting state
```

Preserve the director's action aesthetics and camera design. A weak impact does not automatically justify camera shake, a speed ramp, or additional VFX. Add only the missing physical evidence compatible with L1.

## Continuity Repair

When a fault begins at a cut, define the corrected world/action state and apply it to both sides, including an unfinished motion phase when relevant:

```text
previous segment's outgoing world/action state -> current segment's compatible incoming world/action phase
```

This preserves positions, ownership, contact, momentum and established light/sound facts, not identical visible framing or screen coordinates. Recompute the projection from the new camera; independent generation segments follow the [current segment contract](prompt-writing-sop.md#segment-boundary), rather than copying the last composition. If the user intends a discontinuity or time jump, label that transition and state the new entry condition rather than fabricating an unseen continuous movement.
