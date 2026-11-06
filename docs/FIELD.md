# Field records: where did it grow (plan, nothing built)

Owner request, 2026-11-06: record the exact place of every photo so the spots can be visited again next year to see how a plant spread, and show the places of a species on a Swiss map. The owner also uses this for monitoring invasive neophytes (plants that came from elsewhere and spread), so the same data serves a hobby and a field survey.

## What exists (checked 2026-11-06)

- The exact position is already recorded: `photos.meta.where { lat, lon }`, 6 decimals (about 0.1 m), from the EXIF GPS of the original, from "Tag the photo with my location" (header `X-Position`), or by `tools/ingest.js --positions-only` (docs/GRAPH.md S5 item 3, docs/DEVELOPER.md). 1271 of 1831 photos of the dev database have one.
- It is **private**: stripped from every reply to a client, never part of a public route, never in the published JPEG. Clients only get the rounded `pos` (about 1 km).
- The capture time is kept next to it (`meta.taken`).

So nothing has to change for future ingests to carry the precise position; what is missing is a way to *use* it.

## Decisions to take (open unless marked)

1. **Who sees an exact position.** Default stays: only the owner. A per-photo or per-node choice to show the exact spot publicly is a later, explicit act (rare plants and private gardens must not be given away by default). Open: whether a shared survey group may see members' positions.
2. **Species.** A photo has no species field. Smallest start: a free-text note per photo step (the caption already exists, docs/GALLERY.md S5c) plus an optional structured `species` (Latin name) on the photo's metadata, set by the owner; no automatic identification in the PoC. Open: a species list with German and English names.
3. **Revisit.** The owner's own list/map "my photos by place", newest per spot, with the date taken, so a spot can be photographed again from the same place next year and compared (optional: an overlay of the old photo while taking the new one).
4. **Map.** A private map of the owner's photos (marker per photo or per cluster), filtered by species and year; Swiss base map (swisstopo or OpenStreetMap tiles). Open: the tile source and its licence; offline use in the field (a PWA cache of the area).
5. **Export.** CSV/GeoJSON of the owner's records (species, date, lat/lon, photo link), so the data can go to the owner's other tools. This is also the user-control rule (docs/DESIGN.md S3 goal 9): the owner can always take their data out.
6. **Work and play.** If the app is used for the owner's job, the city's data rules decide where those records may live; keep them separable from the playground (own node tree or space), and never assume the app is the system of record. Open: ask before building any survey-specific field (counts, areas, status of removal).

## Order

1. Per-photo species note and a private "photos by place" list (smallest useful thing).
2. The private map with species and year filter, and GeoJSON/CSV export.
3. Revisit helper (old photo overlay, distance to the old spot).
4. Only if wanted: survey fields and a shared group map.

Nothing here is built; the exact position has been kept since 2026-11-05.

notes:
