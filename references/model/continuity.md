# Segment and Shot Continuity

Here `segment` means one platform generation clip. A camera shot, edit point, or cinematic paragraph is an internal unit and does not authorize a new generated segment.

Continuity is a state-transfer contract, not a prose reminder. Treat one coherent scene as one generated segment by default; use the cross-segment contract below only when a multi-segment request is explicit or the required narrative span is demonstrably longer than 30 seconds.

At every camera cut or focus handoff, the incoming shot paragraph re-establishes the active spatial relation, attention target, possession, and action phase that the viewer needs to read the event. The six-part preamble or previous shot supplies context, but it does not replace the visible opening body state of the current shot.

## Boundary Equality

For hard continuity:

```text
segment N actual final state
= segment N final-shot body pose, contact, momentum, light and sound state
= segment N+1 opening shot
```

The outgoing shot and incoming shot may frame the state differently, but the physical state remains equal until an observable transition changes it. This equation is internal continuity guidance, not text to append to the prompt. The final state lives in the final shot paragraph; the formal prompt ends after that shot's on-set sound sentence, with no extra tail section.

The global opening spatial baseline supplies scene anchors, initial positions/facing and key contacts, not permanent blocking. For each cut, project the previous ending world state through the new camera and framing to derive the visible composition. Narrated movement updates that world state; do not reset to opening positions or copy screen coordinates as if they were world positions. Characters off screen retain their established location. Same-side coverage does not promise an identical screen coordinate in differently framed shots.

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

## Entry and Exit States

- Establish the declared opening state through the visible initial composition, without a timed hold.
- Preserve the ending state or continuing action phase for a later segment when needed, without a fixed duration.
- A continuing action may remain in motion, but its exact phase, direction, speed, balance, and contact state must be stable enough to reproduce.

## Transition Types

- **Hard continuity:** same moment and physical state.
- **Stable-pose cut:** movement resolves into a held state before the cut.
- **Match-on-action:** cut during an attack, deflection, recoil or travel and resume the same event with compatible phase, direction and momentum; the consequence may arrive in the incoming shot. This is not a requirement to settle before cutting.
- **Occlusion/wipe:** a moving foreground element covers the cut; state still transfers.
- **Match cut:** visual relation matches while time or place may change; declare the new state.
- **J-cut/L-cut:** sound begins before or continues after picture; name the sound source and boundary timing.
- **Declared time jump:** continuity of story facts remains, while pose/position may change to the explicitly supplied new entry state.
- **Independent segment:** no inherited prior state; write a complete opening state.

## Action Continuity

For action, preserve direction, path, contact, force, and momentum across the cut. If a weapon is descending at the cut, the next shot begins at the same descent phase unless L1 includes the intervening contact. If a character exits screen right and immediately continues, the next entry direction must match the established geography or show an axis-reestablishing transition.

Do not hide a missing action result in the cut. Contact, landing, recoil, recovery, possession changes, and damage appear either before the boundary or after it in an explicitly continuous phase.

These consequences may overlap or continue into another shot; they are not separate duration slots. A readable state can be moving. No segment boundary, shot, blow, focus change or camera move requires a fixed-duration stability zone. Do not turn phase matching into repeated freezes or replay the impact after a cut.

## Sound Continuity

Carry a sound by source, spatial position, level trend, and timing. Each shot's `现场声：` sentence names the relevant 1–3 real-world sources and their continuation or change, without inventing BGM. A sound bridge must not invent an unestablished voice source or attach narration to a visible mouth. When picture cuts but a line continues within this generation segment, keep the same named speaker, exact text, source type, and acoustic space unless L1 changes them. Allocate consecutive exact original substrings to the shots in which they are heard. Each audible shot quotes its own words and identifies the continuing source (on-screen, off-screen, narration or device); a continuation reminder alone is insufficient. Keep the full source line internally rather than front-loading later words into the starting shot. Concatenating the fragments after excluding optional performance annotations must reproduce the original line including punctuation; a picture cut adds no pause, restart or punctuation. Carry L1's established word-to-shot allocation through compilation. Sound bridges operate at the approved local cut; they do not import another generation segment's events or dialogue.
