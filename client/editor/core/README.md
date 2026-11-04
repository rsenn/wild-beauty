# core

The node document and the rules that change it: `model` (constants, ids, validation), `commands` (everything that changes the node goes through here), `history` (undo/redo snapshots), `store` and `useEditor` (the single open editor), `draft` (dirty tracking and local draft), `pending` (photos waiting for an editor), `galleryScene` and `walls` (gallery scene and wall layer), `text`, `links` (text boxes), `theme`, `tab`.

No DOM, no fetch. `model.js` and `links.js` are also imported by the server, so keep them runnable under Bun.
