# Dialogue and Narration Binding

The only confirmed exact-text syntax is:

```text
角色ID说{逐字台词}
旁白{逐字旁白}
```

Braces contain spoken text only. Put speaker state, delivery, emotion, pause, position, time, sound source, mouth visibility, and listener response outside the braces. Do not wrap the brace content in quotation marks and do not place stage directions inside it.

## Dialogue Contract

For every line, build this internal mapping:

```yaml
dialogue_line:
  line_id:
  time_window:
  speaker_id:
  exact_text:
  source_type: onscreen | offscreen | narration | device
  voice_source:
  mouth_target:
  delivery:
  pre_speech_cue:
  listener_state:
  post_line_reaction:
```

Then compile it into the relevant shot paragraph and, when useful, the shared `光影色彩风格` row's sound-base text.

## On-Screen Speech

```text
6.0-8.5s，父亲位于画面左侧，抬眼看向女儿，短暂吸气后开口；父亲说{门没有锁，是我们一直没推。} 只有父亲的嘴部自然同步。女儿闭口聆听，台词结束后才转向门。
```

- One brace block has one speaker ID and one time window.
- Establish the speaker visually before speech when the mouth is on screen.
- State that the listener remains in a positive listening performance, then reacts after the line's landing point.
- During a speaker handoff: current speaker closes or settles, visual attention transfers, next speaker begins, previous speaker listens.
- If deliberate overlap is locked by L1, give each speaker a separate brace block and explicit overlapping time window.

## Off-Screen Speech and Narration

```text
旁白来自画外且不绑定任何画内嘴部；旁白{那天以后，钟再也没有走过。} 画内人物保持闭口，通过视线和动作回应声音。
```

For an off-screen character, retain the character ID:

```text
父亲的声音来自门外，不绑定画内人物嘴部；父亲说{把灯关掉。}
```

A device voice names the device as spatial source and leaves all character mouths unbound.

## Voice References

Bind each voice asset to one declared role and responsibility:

```text
@audio1：定义父亲的声音｜继承：音色、语速、语气与呼吸｜不继承：原素材台词、背景人声、音乐、画面人物或环境｜作用范围：父亲全部台词
```

This canonical placeholder appears only on the single `素材绑定` row in `【通用约束栏 · 本 segment 共享】`. In shot paragraphs, refer to `父亲` or `父亲声源` without repeating `@audio1`.

An image defines appearance, a motion reference defines approved movement, and an audio reference defines approved sound qualities. None of them silently creates another speaking character.

## Exact-Text Preservation

- Reproduce all characters and punctuation inside braces exactly.
- Divide or retime the surrounding shot rather than paraphrasing a locked line.
- Keep time for the pre-speech cue, delivery, and listener reaction.
- When exact speech competes with flexible camera motion, decoration, or background business, preserve the speech and simplify the flexible element.
- Do not present punctuation, markup, or community conventions as additional platform syntax.
