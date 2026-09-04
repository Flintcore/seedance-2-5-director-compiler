# Execution Complexity and Compression

Complexity is competition for the same time, attention, body, mouth, space, or model responsibility. Treat it semantically; do not invent platform budgets.

## Detect Competition

Mark the exact collision:

- multiple independent action centers in one time block;
- exact dialogue competing with a fast move, visible mouth changes, or dense camera motion;
- one limb, weapon, or prop assigned incompatible states at the same time;
- camera movement hiding the spatial relation or contact that the shot must explain;
- many references defining the same identity or importing conflicting people, voices, motion, or scenery;
- UI/text precision competing with action and performance;
- entry or exit safety zones overloaded with new story events.

## Simplification Order

Preserve:

1. user locks, exact dialogue, story result, and world rules;
2. identity, speaking source, instance count, critical props, and boundary state;
3. causal action, spatial legibility, contact, reaction, and continuity;
4. L1 shot and performance decisions;
5. the single strongest approved texture, atmosphere, or impact detail;

Remove semantically duplicate static phrasing and flexible background business first. Preserve the shot's causal spine and the dynamic anchors that make the current frame readable: active positions, attention targets, held objects, action phase, linked reactions, and the result that motivates the next view. Then reduce decorative effects, secondary motion, redundant reference duties, and nonessential camera complexity. Do not solve overload by changing the locked meaning or dropping the physical result.

## Single Segment First; Split Only Beyond 30s

One coherent scene remains one generated segment whenever its required narrative span fits inside `4-30s`. Multiple beats, camera cuts, dialogue turns, action phases, and reference duties belong inside that segment; they are not separate generation segments.

Split only when one of these conditions is present:

- the user explicitly requests multiple generated segments; or
- the required narrative span is demonstrably longer than 30 seconds through user-stated timing or locked events whose minimum necessary duration still exceeds 30 seconds.

Complexity, action density, dialogue, reference count, or continuity concerns alone are not evidence for a boundary. Before splitting, compress optional embellishment, merge redundant camera changes, and preserve the causal spine in one segment. If the duration evidence is ambiguous, keep one segment.

When a split is genuinely required, place it after a readable state change:

- decision made;
- approach completed;
- contact completed;
- reaction or landing settled;
- door, obstacle, or location threshold crossed;
- line delivered and listener reaction landed.

The preceding segment's final `0.5s` and the following segment's first `0.5s` share the same boundary state. Do not split inside an unspecified contact or identity handoff.

## Reference Budget

All image, video, and audio assets combined stay at or below `50` per segment. Fewer, non-conflicting responsibilities are preferable to redundant assets. Remove conflicting or duplicate duties before adding another reference.
