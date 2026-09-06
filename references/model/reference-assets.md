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

Compile as one natural-language row in `【通用约束栏 · 本 segment 共享】`:

```text
─ 素材绑定：@image1=定义对象或职责（内容描述）· @video1=动作职责（内容描述）
```

## Canonical Placeholder Contract

- Deduplicate identical physical sources before numbering.
- For a new prompt, number each media type independently in first-use order, starting at 1: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`.
- When augmenting an existing prompt, preserve its canonical source-to-placeholder mappings and binding order, including gaps. Append each genuinely new source at the highest existing number of its media type plus 1 (or 1 if that type is absent). Reuse an already bound source and merge its new duties; do not renumber or replace the existing image, video, or audio references. Count unique sources, not the largest numeric suffix. This preserves established bindings, not malformed aliases or repeated occurrences.
- Use lowercase English type names, no hyphen, underscore, space, Chinese alias, original filename, or path.
- Keep paths, filenames, URLs, upload labels, and platform-native IDs only in the internal source ledger.
- Emit each canonical placeholder exactly once in the entire formal prompt, on the `素材绑定` row in `【通用约束栏 · 本 segment 共享】`.
- Merge multiple duties and disjoint time ranges for the same source into that row. Elsewhere use the story's natural name, such as `父亲`, `旧车站`, `起身动作`, or `父亲声源`, without another `@`.

The placeholder is deliberately a convenient replacement token. It does not claim that the destination platform has already bound the asset.

## Separation of Duties

- Character image: appearance of one named character; it does not create another body.
- Costume/prop image: declared garment or prop details; it does not import the source wearer or setting.
- Location image: spatial or material facts; it does not import source people or events.
- Motion video: approved movement, rhythm, or camera relation; it does not replace identity, costume, setting, dialogue, or sound.
- Blender coarse previs video: the scoped spatial and shot reference in [previs-reference.md](previs-reference.md), not the generic motion video's exact performance or internal rhythm. Read that reference only for this input type.
- Voice audio: approved vocal qualities for one source; it does not import its words, other voices, music, ambience, or image content.

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
