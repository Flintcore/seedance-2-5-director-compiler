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

Compile as:

```text
@image1：定义对象或职责｜继承：具体特征｜不继承：冲突内容｜作用范围：镜头/时段
```

## Canonical Placeholder Contract

- Deduplicate identical physical sources before numbering.
- Number each media type independently in first-use order, starting at 1: `@image1`, `@image2`; `@video1`, `@video2`; `@audio1`, `@audio2`.
- Use lowercase English type names, no hyphen, underscore, space, Chinese alias, original filename, or path.
- Keep paths, filenames, URLs, upload labels, and platform-native IDs only in the internal source ledger.
- Emit each canonical placeholder exactly once in the entire formal prompt, only as the leading token of its line in `【参考图权重】`.
- Merge multiple duties and disjoint time ranges for the same source into that one line. Elsewhere use the bound semantic ID, such as `角色A`, `场景A`, `动作参考A`, or `声源A`, without another `@`.

The placeholder is deliberately a convenient replacement token. It does not claim that the destination platform has already bound the asset.

## Separation of Duties

- Character image: appearance of one named character; it does not create another body.
- Costume/prop image: declared garment or prop details; it does not import the source wearer or setting.
- Location image: spatial or material facts; it does not import source people or events.
- Motion video: approved movement, rhythm, or camera relation; it does not replace identity, costume, setting, dialogue, or sound.
- Voice audio: approved vocal qualities for one source; it does not import its words, other voices, music, ambience, or image content.

If one asset genuinely owns multiple duties, list every duty and scope on its single line. When two assets conflict on the same feature, user locks and L1 decide the winner; the compiler does not blend them implicitly.

## Semantic Weight

The formal layer remains named `【参考图权重】`, but no numeric weight is assumed. Express priority through responsibilities such as:

- primary identity;
- required costume/prop detail;
- local environment/material cue;
- motion-only reference;
- voice-only reference;
- optional atmosphere.

Mention only assets actually available or explicitly named. Do not invent upload IDs or platform fields, and do not expose their source locators.
