# Action Execution Engine

Use this module only when `action_mode` is `ACTION_LITE` or `ACTION_FULL`. It converts the locked director design into executable physical continuity. It does not choose the action's visual style, shot grammar, framing, lens, emotional tone, or master reference; those remain director-domain decisions.

## Ownership Boundary

Preserve from L1 without reinterpretation:

- dramatic objective and character intention;
- action aesthetics, choreography concept, shot choice, camera viewpoint, rhythm intention, and style;
- exact story outcome, injuries, damage, powers, weapons, and continuity facts;
- approved duration, dialogue, references, and segment boundaries.

The action engine owns only the physical implementation: tactical causality, beat timing, direction, path, contact, force, inertia, environmental response, opponent isolation, start/end states, and cross-shot interfaces.

If a physical detail is absent, choose the smallest compatible implementation that makes the locked design executable. Do not add a new stunt, reversal, injury, power, prop, opponent, or story beat.

## Route

### ACTION_LITE

Use for a chase beat, fall, grab, collision, single attack, block, dodge, or other movement whose physical execution is the main difficulty. Record:

- start state;
- tactical purpose;
- direction and path;
- contact and force response when present;
- end state and next-shot interface.

### ACTION_FULL

Use for sustained combat, weapons, 1vN, heavy weapons, powers, or dense projectiles. Build the complete action contract below for every shot or time block.

## Internal Action Contract

Keep this structure internal. Compile its content into the relevant continuous shot paragraphs of the current six-part prompt. Each paragraph ends with its concrete `光影：` and `现场声：` sentences; exact spoken text appears once in Chinese double quotes at the speaking moment within that same paragraph, with delivery and action outside the quote by default. Body pose, contact, momentum and the final half-second state remain in the corresponding shot, not an extra tail field. Do not print a second prompt format.

```yaml
action_contract:
  shot_id:
  tactical_goal:
  pressure_or_opportunity:
  start_state:
    body_pose:
    balance_and_weight:
    facing_and_gaze:
    hand_weapon_prop_state:
    world_position:
    screen_position:
    incoming_momentum:
  direction_and_path:
    world_axis:
    screen_axis:
    path:
    contact_point:
  beats:
    - time_window:
      intent:
      initiation:
      travel:
      contact_or_change:
      force_vector:
      inertia_chain:
      environment_feedback:
      opponent_response:
      resulting_state:
  end_state:
    body_pose:
    balance_and_weight:
    facing_and_gaze:
    hand_weapon_prop_state:
    world_position:
    screen_position:
    outgoing_momentum:
  next_shot_interface:
```

## 表演连续性

The action engine receives the director's performance anchor with the physical start state. Carry the character's attention target or gaze direction, control level, breath load, and body trajectory through preparation, contact, recovery, and the outgoing state when those cues are part of the locked design. A small action repeats only when it naturally continues or is triggered again; continuity is not repeated gesture. Physical completeness must not erase the acting; express it through gaze, timing, grip, posture, weight, breath, recovery, or the opponent's reaction rather than a facial checklist.

When the difficulty is generic character behavior, disappearing fatigue/injury, or a new exchange that resets what the previous one taught the character, read the relevant action/character chapters and examples in [角色行为与动作叙事参考库](../references/cinema/角色行为与动作叙事参考库.md). Reuse chapters already read; ordinary physical clarification does not load a new acting package. Preserve the director's character strategy through the choice of route, timing, protection, hesitation, grip and recovery. Accumulate established body conditions—breath demand, painful support, weakened grip, changed range—without inventing a new injury or imposing a numerical fatigue meter. A tactical pause still contains observation, recovery, support or an intentionally held stance, not a reset to idle.

## Tactical Causality

Write each exchange as a causal chain:

```text
current pressure or opportunity
-> character's tactical choice
-> initiated action
-> path and contact
-> force and environmental response
-> opponent result
-> new spatial relationship
-> next pressure or opening
```

Every move must purchase something readable: distance, angle, cover, weapon access, escape route, balance, information, or control. Decorative choreography may remain only when L1 explicitly locks it; even then, connect it to a physical consequence.

The written shot keeps the whole meaningful chain: tactical reason -> initiation -> path -> contact/avoidance -> feedback -> new state. Camera prose may become shorter; the chain does not. The new state constrains the next choice and carries the character's style and accumulated body condition, rather than ending at a result-only verb or returning to the original fighting pose.

## Beat Timing

Partition only where physical state changes. A useful beat can contain:

```text
prepare or perceive -> initiate -> travel -> contact or evade -> force response -> settle or carry momentum onward
```

- Give every beat an ordered time window inside the segment duration.
- Keep the first and last `0.5s` as stable entry and exit phases.
- Let acceleration, contact, recoil, landing, and recovery occupy visible time; do not collapse cause and result into the same instant.
- Preserve director-locked slow/fast contrast. Do not introduce slow motion, freeze frames, speed ramps, or impact camera effects on the engine's own initiative.
- When the locked actions do not fit, compress optional embellishment first and keep the action chain in one generated segment whenever its required narrative span is 30 seconds or less. Propose a segment boundary only for an explicit multi-segment request or a causal spine whose user-stated/locked minimum timing demonstrably exceeds 30 seconds, and place it at a stable physical state.

## Direction, Path, and Axis

Track world direction and screen direction separately.

- State start point, route, and end point for every displacement.
- Use fixed environmental anchors to make paths readable.
- State the exact body, weapon, projectile, surface, or prop that makes contact.
- Preserve the established screen axis across cuts.
- When L1 deliberately changes axis, include the transition view or movement that establishes the new screen-direction mapping.
- A reverse, detour, arc, fall, ricochet, or projectile turn needs a visible cause. Trajectory follows the world rules rather than a universal curve rule.

## Contact, Force, and Inertia

For every meaningful contact, specify:

1. contact pair and contact point;
2. incoming direction and momentum;
3. force transfer through body, weapon, prop, or surface;
4. reaction of both sides;
5. visible state after contact.

Body-driven action uses the character's planted foot, hip, torso, shoulder, and limb chain. A heavy weapon has its own momentum: acceleration shifts the wielder's balance, the weapon pulls the body through its path, and the floor, target, guard, or recovery motion finally redirects or dissipates that momentum. Superhuman control may alter this chain only when the world rules or L1 establish it.

Avoid result-only verbs such as “击飞” without the contact and force chain that produces the result.

## Environmental Feedback

Use feedback as evidence of force, not decoration. Select the most legible response already compatible with the environment: foot slip, cloth pull, dust displacement, water splash, surface flex, debris movement, weapon vibration, displaced furniture, or a change in sound perspective.

An invisible power needs an observable carrier already compatible with the world: air distortion, rain or dust deflection, cloth and loose-object motion, surface pressure, shadow/light change, or another approved phenomenon. The carrier shows origin, path, intensity, and result.

## 1vN Isolation

Do not schedule all opponents as independent simultaneous action centers. Build temporary local contests through distance, obstacle, height, doorway, cover, line of sight, stagger, knockback, weapon reach, or another scene-supported separator.

For each handoff, state:

- which opponent currently applies pressure;
- why the others are delayed or spatially excluded;
- what result opens the next opponent's route;
- where every visible opponent remains during the exchange.

This preserves the director's intended scale while keeping the action readable and causally ordered.

## Cross-Shot Interface

The outgoing state of one shot is the incoming state of the next. Carry all physically active fields:

- body pose, balance, planted foot, facing, gaze, and breathing load;
- hand, weapon, prop, and grip state;
- world and screen position;
- velocity, rotational direction, falling phase, recoil, or other momentum;
- opponent positions and active pressure;
- damage, debris, dust, water, light, and sound state;
- camera side of axis when it affects screen direction.

Do not reset a stance, grip, wound, broken object, opponent position, or momentum at a cut. A deliberate time jump must declare the new state in L1; the engine does not invent the missing transition.

## Compilation Handoff

Return only the completed internal action contract to the compiler. The compiler places:

- each shot's start body state, contact and incoming momentum in that shot's opening, preserving the previous shot's end state;
- causal beats, paths, contact, force, inertia, and feedback in the relevant shot paragraphs;
- the shot's actual lighting relationship and physically caused changes or approved stability in its `光影：` sentence, without inventing a new effect or changing deliberate shadow/occlusion;
- action sounds from the relevant 1–3 real-world sources, with their event timing and perspective, in that shot's `现场声：` sentence; no added BGM;
- end body state, contact and outgoing momentum in each shot's ending, with the final half-second state in the last shot;
- exact action dialogue embedded in Chinese double quotes in the continuous visual event; its speaker, timing, delivery and reactions stay alongside it, outside the quote by default;
- applicable short delivery switches once in `【全局约束】`; size, support and staging relations remain positive scene descriptions rather than a negative tail list.

Keep the action contract internal. End the formal output with the last shot's on-set sound sentence; no closing constraints card or extra action contract follows it.
