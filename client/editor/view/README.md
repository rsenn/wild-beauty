# view

Rendering and presentation: `render` (document -> vnodes, shared with the viewer), `swatches` and `scenepalette` (colours), `edge` (edge decoration), `ordering` (draw order of a selection), `cascade` (where an added photo lands), `playback` (step playback).

`render.js` is also imported by the server (`server/`), so it stays free of editor state.
