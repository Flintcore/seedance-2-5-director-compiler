# Reference Asset Responsibilities

The confirmed asset contract is a maximum of `50` total image, video, and audio references per segment. Count them together.

## Responsibility Map

Every unique source receives an internal map and a separate canonical output placeholder:

```yaml
asset:
  source_ref:
  type: image | video | audio
  output_placeholder: "@image1 | @video1 | @audio1"
  defines:
  inherit: []
  exclude: []
  applies_to:
  instance_effect: none | declared_instance
```

Compile into the second part, `【素材绑定】`, after `【风格】`. This is a binding excerpt, not a complete prompt:

```text
【素材绑定】@image1为命名人物的外观参考；@video1为已批准动作或摄影机路径的参考。
```

## Canonical Placeholder Contract

- Deduplicate identical physical sources before numbering.
- For a new prompt, number each media type independently in first-use order, starting at 1: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`.
- When augmenting an existing prompt, preserve its canonical source-to-placeholder mappings and binding order, including gaps. Append each genuinely new source at the highest existing number of its media type plus 1 (or 1 if that type is absent). Reuse an already bound source and merge its new duties; do not renumber or replace the existing image, video, or audio references. Count unique sources, not the largest numeric suffix. This preserves established bindings, not malformed aliases or repeated occurrences.
- Use lowercase English type names, no hyphen, underscore, space, Chinese alias, original filename, or path.
- Keep paths, filenames, URLs, upload labels, and platform-native IDs only in the internal source ledger.
- Emit each canonical placeholder exactly once in the entire formal prompt, inside `【素材绑定】`.
- Merge multiple duties and disjoint time ranges for the same source into its single binding item. Elsewhere, including `【全局约束】` and inline speaking events, use the story's natural name, such as `父亲`, `旧车站`, `起身动作`, or `父亲声源`, without another `@`.
- Without external references, keep `【素材绑定】` and write `无外部参考素材`; place necessary shared character or setting facts in `【全局约束】` instead. Do not invent an asset token to fill the section. Neither static global facts nor reference duties replace the current pose, contact, gaze, or spatial relation inside each shot.

The placeholder is deliberately a convenient replacement token. It does not claim that the destination platform has already bound the asset.

## Separation of Duties

- Character image: appearance of one named character; it does not create another body.
- Costume/prop image: declared garment or prop details; it does not import the source wearer or setting.
- Location image: spatial or material facts and scoped lighting; it does not import source people/events or automatically dictate camera angle and framing. Follow the approved shot design unless the user explicitly locks the reference's composition.
- Motion video: approved movement, rhythm, or camera relation; it does not replace identity, costume, setting, dialogue, or sound.
- Blender coarse previs video: the scoped spatial and shot reference in [previs-reference.md](previs-reference.md), not the generic motion video's exact performance or internal rhythm. Read that reference only for this input type.
- Voice audio: approved voice identity for one source; local delivery changes with the scene's tactic and physical condition unless the user locks the reference delivery. It does not import its words, other voices, music, ambience, or image content.

If one asset genuinely owns multiple duties, list every duty and scope on its single line. When two assets conflict on the same feature, user locks and L1 decide the winner; the compiler does not blend them implicitly.

## Semantic Weight

No numeric weight is assumed. Express priority through responsibilities such as:

- primary identity;
- required costume/prop detail;
- local environment/material cue;
- motion-only reference;
- voice-only reference;
- optional atmosphere.

Mention only assets actually available or explicitly named. Do not invent upload IDs or platform fields, and do not expose their source locators.

Only current-segment duties enter the formal binding. Preserve necessary carried states in semantic shot prose, but leave unrelated earlier people, props, tags and scene notes out. Emotional context in earlier dialogue does not by itself create a visible person or a new speaking voice. Do not replace a reference's identity with exhaustive invented anatomy or treat “100% matching” as a measured guarantee.
