# Reference Asset Responsibilities

The confirmed asset contract is a maximum of `50` total image, video, and audio references per segment. Count them together.

## Responsibility Map

Every asset receives one explicit map:

```yaml
asset:
  id:
  type: image | video | audio
  defines:
  inherit: []
  exclude: []
  applies_to:
  instance_effect: none | declared_instance
```

Compile as:

```text
素材ID：定义对象或职责｜继承：具体特征｜不继承：冲突内容｜作用范围：镜头/时段
```

## Separation of Duties

- Character image: appearance of one named character; it does not create another body.
- Costume/prop image: declared garment or prop details; it does not import the source wearer or setting.
- Location image: spatial or material facts; it does not import source people or events.
- Motion video: approved movement, rhythm, or camera relation; it does not replace identity, costume, setting, dialogue, or sound.
- Voice audio: approved vocal qualities for one source; it does not import its words, other voices, music, ambience, or image content.

If one asset genuinely owns multiple duties, list each duty and scope explicitly. When two assets conflict on the same feature, user locks and L1 decide the winner; the compiler does not blend them implicitly.

## Semantic Weight

The formal layer remains named `【参考图权重】`, but no numeric weight is assumed. Express priority through responsibilities such as:

- primary identity;
- required costume/prop detail;
- local environment/material cue;
- motion-only reference;
- voice-only reference;
- optional atmosphere.

Mention only assets actually available or explicitly named. Do not invent upload IDs or platform fields.
