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

Stop at the first layer that can explain every observed downstream symptom. Do not rewrite later layers independently when correcting the earlier cause will resolve them.

## Symptom Routing

| Symptom | Inspect first | Typical direct repair |
|---|---|---|
| wrong face, duplicate character, extra prop | identity facts, instance ledger, asset responsibility | stabilize ID/count and narrow asset scope |
| teleport, reversed direction, pose reset | entry state, direction map, prior exit | replace boundary state and affected first beat |
| wrong scale, conflicting support, position or framing | locked dimensions, common spatial reference, depth, pose, support/contact, action and composition | read [positive-spatial-constraints.md](../references/model/positive-spatial-constraints.md); repair the incompatible positive relation rather than adding an ending prohibition |
| flat or excessive expression, unreadable listener response, emotional reset at a cut | character motive, knowledge timing, gaze target, visible channel, prior state | read [micro-performance.md](micro-performance.md); repair the affected trigger-response-transition in continuous shot prose, preserving the camera and dialogue locks |
| wandering gaze during dialogue or unintended lens contact | intended addressee, actual head/eye direction, target position, viewpoint and any motivated diversion | restore the explicit conversation eyeline in the affected shot; preserve intentional avoidance, then carry the world target through reverse views rather than appending a negative gaze constraint |
| flat audiovisual language despite complete camera parameters | audience information/attention arc, spatial layers, framing or motion contrast, sound perspective and rhythm | use the motivated audiovisual guidance in [shot-design.md](shot-design.md) for permitted director redesign; if L1 already has these choices, repair compilation rather than inventing new shots |
| weak or weightless hit | contact pair, force vector, inertia chain | replace the affected action beat and synchronized feedback |
| unreadable 1vN action | pressure ownership, attack lines and spatial/temporal separation | restore one legible contact and the handoff to the next threat; use actual range, obstacles or imbalance to distinguish concurrent pressure, not a queue in which all other opponents wait |
| wrong speaker or moving listener mouth | speaking source, time window, mouth target | repair the inline speaking event, listener state, and human-voice mapping |
| missing or changed words | exact spoken quote after excluding performance annotations and available time | restore the spoken content and adjust surrounding timing without editing the words |
| wrong voice or imported background audio | audio asset responsibility | narrow the audio inheritance and replace the human-source mapping |
| cut discontinuity | previous exit, current entry, sound bridge | make both sides share one state vector |
| overloaded or omitted event | timeline competition | preserve locked essentials and move flexible decoration out of the block |

## Minimal Repair Output

Return a compact repair card followed by the exact replacement text:

```text
症状：{timestamp + observable mismatch}
最早根因：{one cause in one owner layer}
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

When a fault begins at a cut, define one corrected state vector and apply it to both sides:

```text
previous segment's visible end state = current segment's visible opening state
```

If the user intends a discontinuity or time jump, label that transition and state the new entry condition rather than fabricating an unseen continuous movement.
