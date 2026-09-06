# Model Reference Router

This directory is the compiler-domain authority. Read only the references needed by the active task.

| Reference | Read when |
|---|---|
| `capability-registry.yaml` | every full compilation; duration, asset, safety-zone, or dialogue contract |
| `nine-layer-schema.md` | every full prompt or structural prompt repair; compatibility filename for the native shot schema |
| `dialogue-binding.md` | any spoken line, narration, device voice, voice reference, or speaker failure |
| `continuity.md` | cross-segment sequences, continuation, entry/exit matching, momentum, or sound bridges; read its cross-segment parts only after the boundary gate, while ordinary scenes use shot-level states |
| `complexity.md` | overloaded timing, omitted events, too many concurrent subjects, or prompt compression |
| `reference-assets.md` | image/video/audio references, identity leakage, duplicated instances, or asset-scope conflicts |
| `previs-reference.md` | adding a Blender coarse previs video to an existing prompt; proxy-to-character mapping, spatial/shot duties, and preservation of original performance and assets |

No cinema or masters document may override these contracts. Values absent from the registry remain unknown rather than becoming inferred platform facts.
