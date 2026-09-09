# Dialogue and Narration Binding

The only confirmed exact-text syntax is:

```text
台词：角色名说{逐字台词}
台词：旁白{逐字旁白}
```

These are local line examples, not a complete prompt or two mandatory lines. Braces contain spoken text only. Put speaker state, delivery, emotion, pause, position, time, sound source, mouth visibility, and listener response in the continuous shot prose, outside the braces. Necessary timing, delivery or source cues may also precede the braces on the dialogue line. The optional `台词：` line follows that paragraph's `光影：` and `现场声：` sentences and ends the shot block. List multiple utterances in order on one line, or use consecutive independent `台词：` lines for a complex multi-speaker exchange; prose does not resume after that dialogue tail. Omit the line when nobody speaks. Do not repeat the exact brace text inside the prose, wrap it in quotation marks, or place stage directions inside it.

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

Compile the performance, listening, and sound-source timing into the relevant shot paragraph; put the exact utterance only on its independent dialogue line. Voice assets belong in `【素材绑定】`; the shot's `现场声：` describes the 1–3 relevant real-world sound sources, their timing and perspective, without duplicating the spoken text or adding BGM. Full layout belongs to [the canonical schema](nine-layer-schema.md).

## On-Screen Speech

```text
6.0-8.5s，父亲位于画面左侧，抬眼看向女儿，短暂吸气后开口说明门一直可以推开；父亲的嘴部自然同步，女儿看着他聆听，台词结束后才转向门。
台词：父亲说{门没有锁，是我们一直没推。}
```

- This excerpt demonstrates speech placement only; a complete shot also retains its approved camera, action, light and on-set sound sentences. One brace block has one named speaker and one internal time window.
- Establish the speaker visually before speech when the mouth is on screen.
- For ordinary directed dialogue, make the addressee and speaker/listener eyelines explicit in the shot prose, normally toward the other's face/eyes; keep established task attention, avoidance, or distraction. The body facing a person does not by itself establish the eye target. Off-screen addressees retain their spatial location; an over-shoulder camera is not the addressee. For shifts and reverse-shot continuity, read [micro-performance.md](../../modules/micro-performance.md).
- The listener may give a silent gaze/body response when the relevant information arrives, while the current speaker keeps speaking. The listener's own line follows the intended turn-taking or explicitly locked overlap; do not delay every listening reaction until the full sentence ends or turn a listening response into an extra spoken line.
- During a speaker handoff, establish the next voice source and any visible speaking mouth correctly, while the previous speaker settles into listening. Framing, camera movement, focus, and the audience's viewing target follow the approved design: the image may remain on the listener while the next speaker is heard off screen. A new speaking turn does not by itself require a cut, focus transfer, or reset of character eyelines.
- If deliberate overlap is locked by L1, give each speaker a separate brace block and explicit overlapping time window.

## Off-Screen Speech and Narration

```text
旁白来自画外；画内人物保持闭口，沿用既定视线和动作，不因旁白出现而补造反应。
台词：旁白{那天以后，钟再也没有走过。}
```

For an off-screen character, retain the character ID:

```text
父亲的声音来自门外；画内女儿闭口听到指示后，按既定动作看向电灯开关。
台词：父亲说{把灯关掉。}
```

A device voice names the device as spatial source and leaves all character mouths unbound.

## Voice References

Bind each voice asset to one declared role and responsibility:

```text
@audio1：定义父亲的声音｜继承：音色、语速、语气与呼吸｜不继承：原素材台词、背景人声、音乐、画面人物或环境｜作用范围：父亲全部台词
```

This local asset example belongs only inside `【素材绑定】`. In shot prose and the independent dialogue line, refer to `父亲` or `父亲声源` without repeating `@audio1`.

An image defines appearance, a motion reference defines approved movement, and an audio reference defines approved sound qualities. None of them silently creates another speaking character.

## Exact-Text Preservation

- Reproduce all characters and punctuation inside braces exactly.
- Preserve locked shot boundaries and timing. Adjust only flexible surrounding business before proposing a needed timing change; a long line alone does not authorize an extra generation segment. Keep the exact spoken text intact.
- Keep time for the pre-speech cue, delivery, and listener reaction.
- When exact speech competes with flexible camera motion, decoration, or background business, preserve the speech and simplify the flexible element.
- Do not present punctuation, markup, or community conventions as additional platform syntax.
