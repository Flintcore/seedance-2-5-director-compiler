# Dialogue and Narration Binding · inline speech

## Current Writing Contract

Embed exact speech at its speaking moment inside the shot's continuous prose, using Chinese double quotation marks. State who speaks and where the voice originates. The default keeps all emotion, facial action, delivery and body action outside the quoted words:

```text
父亲看着女儿，停一拍，语气放缓地说：“门没有锁，是我们一直没推。”女儿听完才转向门。
```

This is a local excerpt, not a complete prompt. A complete shot still begins with camera information and its initial visible frame, develops the event and ends with `光影：` and `现场声：`. There is no separate dialogue tail. Do not move the spoken words out of the event or repeat them in the sound sentence. When nobody speaks, preserve the action without inventing a speech placeholder.

A longer utterance may need an exact mid-line pause or performance turn. Only then insert `【non-spoken performance direction】` at that position inside the double quotes:

```text
父亲先把声音放缓，对女儿说：“我不是要你现在就原谅他，【停一拍，视线落到她脸上，后半句的语气更坚决】我是要你先听完，再决定要不要关上这扇门。”
```

This optional example is not a sentence to import into a scene. Short dialogue uses external performance prose; long dialogue also prefers it unless a mid-line change needs localization. Length alone is not a trigger, and there is no character-count threshold or annotation quota. Keep directions brief and tied to the known character/task, not a mandatory emotion-plus-every-face-part list. The `【】` text is a non-spoken insertion; removing the insertion reproduces the original words and punctuation. Close each quote and annotation and do not nest performance annotations. If the approved actual line already contains quotation marks or written brackets, preserve that source content rather than silently treating it as an inserted instruction.

Double quotes and optional performance annotations are the user's local writing convention, not a claim that a platform guarantees parsing or voice control. This contract replaces the former independent-line/braced output convention; legacy input may be read for its content, but ordinary final output uses the current convention.

## Internal Speaking-Event Map

Use the existing internal mapping only as needed to preserve the utterance:

```yaml
dialogue_event:
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
  fragments: # optional internal cross-shot allocation, reusing the approved cut
    - shot_id:
      text: # only the consecutive source words heard in this shot
```

`exact_text` stores the full actual spoken words and punctuation only. Preserve the approved shot-local portions separately, using the existing L1 or optional `fragments` (shot ID plus consecutive source text); their concatenation equals `exact_text`. Keep necessary timing, pauses, source visibility and optional insertion positions in delivery/context, never mixed into that source text. This is internal reasoning, not another required output table or file. Voice assets belong in `【素材绑定】`; the shot's `现场声：` contains the relevant 1–3 real-world sources and their timing/perspective without repeating spoken text or adding BGM. Full layout belongs to [the canonical schema](nine-layer-schema.md).

## On-Screen Speech and Listening

- Establish the intended speaker and any visible speaking mouth. Every utterance has a clear voice source; do not infer that every quoted phrase is spoken. For example, `纸条上写着“请随手关门”` is visible prop text, not an instruction for a character to read it aloud.
- For ordinary directed dialogue, make the addressee and speaker/listener eyelines explicit, normally toward the other's face/eyes; keep established task attention, avoidance or distraction. Body orientation alone does not establish eye direction. An over-shoulder camera is not the addressee. For shifts and reverse-shot continuity, use [micro-performance.md](../../modules/micro-performance.md).
- The listener can react when the relevant information arrives while the current speaker continues. Their next spoken turn follows the intended timing or explicit overlap. Do not delay every reaction until the sentence ends or convert silent reception into extra dialogue.
- During a speaker handoff, establish the next voice source and visible mouth correctly while the previous speaker settles into listening. The picture may stay on the listener with the next speaker off screen. Turn-taking alone does not require a cut, focus transfer or eyeline reset.
- Speech is an action, not a hold command for the camera/body. Continue approved walking, handling, camera travel and listener behavior when compatible. Put closed-mouth, breath-holding or other conflicting actions before/after speech or at a real pause. Preserve the words while the tactic and reception shape their delivery.
- For deliberate overlap locked by L1, keep each speaker's own quoted utterance and make their overlapping time windows clear. Do not merge two speakers into one quotation.

## Off-Screen Speech, Narration and Devices

```text
画外旁白平缓地说：“那天以后，钟再也没有走过。”画内人物延续既定动作，不对旁白配口型或凭空补反应。
```

An off-screen character retains their identity and spatial source:

```text
门外的父亲低声说：“把灯关掉。”画内女儿闭口听到指示后，按既定动作看向电灯开关。
```

A device voice names the physical source, such as a radio or speaker, with human mouths unbound. Identify whether it is an established person's transmitted voice or the device's own announcement; avoid inventing a second speaker from a reference clip. These are local placement examples, not standalone complete shots.

## Voice References

Bind each voice asset to its declared role and responsibility:

```text
@audio1：定义父亲的声线身份｜继承：已锁音色、口音与发声质感；当场速度、重音、音量、气息和停顿按各镜策略及身体状态表演，明确锁定的参考说法优先｜不继承：原素材台词、背景人声、音乐、画面人物或环境｜作用范围：父亲全部台词
```

This local asset example belongs only inside `【素材绑定】`. In shot prose refer to `父亲` or `父亲声源` without repeating the asset token. An image defines appearance, a motion reference defines approved movement, and audio defines approved sound qualities; none silently creates a speaking character.

## Speech Across a Cut

A continuing utterance is one speaking event, but its written words belong to the shots in which they are heard. Split the original at the approved picture cuts into consecutive exact substrings. Every shot carrying speech quotes its own audible substring in the continuous prose and names the original speaker or voice source; specify on-screen/off-screen/narration/device as needed. Preserve L1's established allocation rather than folding it back into one quote in the starting shot. Keep the full line as the internal source, not as an extra spoken quote in the first shot or preamble. Later prose such as “同一句话继续” does not substitute for the actual continuation words. Concatenating all portions in the speaking event reproduces every original word and punctuation mark without overlap or loss. A picture cut alone adds no ellipsis, full stop, pause or restart.

Picture may cut at a pause or during fluent speech, stay on a listener, show an approved insert, or move while the speech continues. No added pause is required just to make editing convenient. Keep the listener's knowledge and response aligned with the words they have heard. Cross-shot scope and transition description usually sit outside quotes; do not put an editing note inside a short utterance just because its sound crosses a cut. The continuation stays within the current generation segment unless multi-segment work was explicitly established. The same rule covers sound leading picture (J-cut), picture leaving the speaker (L-cut), off-screen speech, narration and devices: locate words by the shot in which they are heard, not by the first view of a speaking face. Camera travel without a picture cut remains one shot and does not require splitting the line. A genuinely silent shot has no invented speech placeholder.

## Exact-Text Preservation and Lightweight Output

- Strip only the deliberately inserted non-spoken performance annotations when comparing the compiled spoken content with the locked source. Preserve all original characters, punctuation, particles, repetitions and dialect. Ordinary prop/quotation text is outside this speech comparison unless it is explicitly read aloud.
- Preserve locked shot boundaries and timing. Simplify only flexible camera decoration or background business before proposing a necessary timing change; long dialogue alone does not authorize another generation segment.
- Keep time for the pre-speech cue, delivery and listener reaction. Do not invent internal emotional turns to justify inserting annotations.
- Keep narration and transmitted voices distinguishable from live on-set speech and background sound. Sound-source identity follows the story, not the current visible face.
- Maintenance parsing/tests can compare ordered source text across consecutive quote fragments. An explicit shot-local baseline (optional `expectedDialogue[].fragments` containing `shot_id` and `text`, or a single-shot `shot_id`) additionally checks allocation; a text-only baseline proves no word-to-shot timing. Ordinary prose and arbitrary voice overlaps still need contextual interpretation. These developer checks neither guarantee model execution nor create a mandatory runtime self-check stage.
