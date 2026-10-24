# Model Reference Router

当前先执行 [必读写作 SOP](../../modules/prompt-writing-sop.md)；本入口只选择相关知识。全部现有专题和大师入口见 [知识调用地图](../writing/knowledge-map.md)。

This directory is the compiler-domain authority. Read only the references needed by the active task.

| Reference | Read when |
|---|---|
| `capability-registry.yaml` | every full compilation; duration, asset, generation-mode, or dialogue contract |
| `nine-layer-schema.md` | every full prompt or structural prompt repair; compatibility filename for the native shot schema |
| `dialogue-binding.md` | any spoken line, narration, device voice, voice reference, or speaker failure |
| `continuity.md` | cross-segment sequences, continuation, entry/exit matching, momentum, or sound bridges; read its cross-segment parts only after the boundary gate, while ordinary scenes use shot-level states |
| `complexity.md` | overloaded timing, omitted events, too many concurrent subjects, or prompt compression |
| `reference-assets.md` | image/video/audio references, identity leakage, duplicated instances, or asset-scope conflicts |
| `previs-reference.md` | explicit previs planning/making, a supplied previs reference, or explicit continuation of that workflow only; minimum geometry, optional Blender handoff, proxy mapping and preservation of the original prompt. Ordinary shot work skips it |
| `positive-spatial-constraints.md` | size/scale/position control, conflicting contact or composition, or repairing negative-phrase patches; positive visible relations and limited delivery exclusions |

No cinema or masters document may override these contracts. Values absent from the registry remain unknown rather than becoming inferred platform facts.
