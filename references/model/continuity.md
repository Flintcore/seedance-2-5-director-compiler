# Segment and Shot Continuity

Here `segment` means one platform generation clip. A camera shot, edit point, or cinematic paragraph is an internal unit and does not authorize a new generated segment.

Continuity is a state-transfer contract, not a prose reminder. Treat one coherent scene as one generated segment by default; use the cross-segment contract below only when a multi-segment request is explicit or the required narrative span is demonstrably longer than 30 seconds.

At every camera cut or focus handoff, the incoming shot paragraph re-establishes the active spatial relation, attention target, possession, and action phase that the viewer needs to read the event. A shared row or previous shot supplies context, but it does not replace the visible opening state of the current shot.

## Boundary Equality

For hard continuity:

```text
segment N actual final state
= segment N final shot / `【收尾约束】`
= segment N+1 opening shot
```

The outgoing shot and incoming shot may frame the state differently, but the physical state remains equal until an observable transition changes it.

## State Vector

Carry only fields active at the cut:

```yaml
boundary_state:
  time_relation:
  visible_instances:
  world_positions:
  screen_positions:
  body_poses_and_balance:
  facing_gaze_and_visibility:
  hands_weapons_props_and_contacts:
  action_phase_and_momentum:
  damage_dirt_wetness_and_debris:
  light_weather_and_practical_states:
  active_sound_and_music:
  camera_side_and_screen_axis:
```

## Safety Zones

- The first `0.5s` establishes the declared entry state without a continuity reset.
- The final `0.5s` settles or sustains the declared ending state so a later segment can reproduce it when needed.
- A continuing action may remain in motion, but its exact phase, direction, speed, balance, and contact state must be stable enough to reproduce.

## Transition Types

- **Hard continuity:** same moment and physical state.
- **Stable-pose cut:** movement resolves into a held state before the cut.
- **Occlusion/wipe:** a moving foreground element covers the cut; state still transfers.
- **Match cut:** visual relation matches while time or place may change; declare the new state.
- **J-cut/L-cut:** sound begins before or continues after picture; name the sound source and boundary timing.
- **Declared time jump:** continuity of story facts remains, while pose/position may change to the explicitly supplied new entry state.
- **Independent segment:** no inherited prior state; write a complete opening state.

## Action Continuity

For action, preserve direction, path, contact, force, and momentum across the cut. If a weapon is descending at the cut, the next shot begins at the same descent phase unless L1 includes the intervening contact. If a character exits screen right and immediately continues, the next entry direction must match the established geography or show an axis-reestablishing transition.

Do not hide a missing action result in the cut. Contact, landing, recoil, recovery, possession changes, and damage appear either before the boundary or after it in an explicitly continuous phase.

## Sound Continuity

Carry a sound by source, spatial position, level trend, and timing. A sound bridge must not imply an unseen speaker or attach narration to a visible mouth. When picture cuts but a line continues, keep the same speaker ID, exact brace text, source type, and acoustic space unless L1 changes them.
