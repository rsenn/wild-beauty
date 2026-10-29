-- Schema of data/wb.sqlite3 (PLAN.md S8). Migrations are numbered blocks, each
-- applied once in a transaction; PRAGMA user_version holds the last applied
-- number. Never edit an applied block, append a new one.

-- migration 1
CREATE TABLE photos (
  hash       TEXT PRIMARY KEY,
  ext        TEXT NOT NULL,
  width      INTEGER,
  height     INTEGER,
  bytes      INTEGER,
  palette    TEXT,
  meta       TEXT,
  created_at INTEGER NOT NULL
);

-- the graph columns (owner_id .. tile) are written as defaults by the PoC
CREATE TABLE nodes (
  id         INTEGER PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT '',
  doc        TEXT NOT NULL,
  palette    TEXT,
  kind       TEXT NOT NULL DEFAULT 'node',
  owner_id   INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public',
  group_id   INTEGER,
  x          REAL,
  y          REAL,
  pinned     INTEGER NOT NULL DEFAULT 0,
  tile       TEXT,
  rev        INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- role 'texture': not shown, used by the node's 3D scene
CREATE TABLE node_photos (
  node_id    INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  photo_hash TEXT NOT NULL REFERENCES photos(hash),
  sort       INTEGER NOT NULL DEFAULT 0,
  role       TEXT NOT NULL DEFAULT 'picture',
  PRIMARY KEY (node_id, photo_hash)
);

CREATE INDEX node_photos_hash ON node_photos(photo_hash);

-- label: 'child' (ordered by sort), 'ref' or 'sells'
CREATE TABLE node_links (
  id      INTEGER PRIMARY KEY,
  from_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_id   INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  label   TEXT NOT NULL,
  sort    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (from_id, to_id, label)
);

CREATE INDEX node_links_from ON node_links(from_id, sort);
CREATE INDEX node_links_to ON node_links(to_id);

-- editor lock (EDITOR.md S2.8)
CREATE TABLE node_locks (
  node_id     INTEGER PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
  holder      TEXT NOT NULL,
  user_id     INTEGER,
  acquired_at INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

-- migration 2
-- A place a saved node's photo was taken near, kept until the owner links or
-- dismisses it (GRAPH.md S1.5). Only the position rounded to ~1 km, and only
-- for the owner; a row goes when it is answered or its node goes.
CREATE TABLE place_suggestions (
  node_id INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  lat     REAL NOT NULL,
  lon     REAL NOT NULL,
  PRIMARY KEY (node_id, lat, lon)
);

-- migration 3
-- The municipality a rounded position (the 0.01 degree cell) lies in, as the
-- federal geoportal told us (GRAPH.md S1.5), so a place is named once and
-- found again without a request. name NULL: the cell is outside Switzerland.
CREATE TABLE place_names (
  lat  REAL NOT NULL,
  lon  REAL NOT NULL,
  name TEXT,
  PRIMARY KEY (lat, lon)
);

-- migration 4
-- Places made before the municipality lookup were titled by the offline
-- gazetteer without the canton ("Zürich"); they are now "Zürich (ZH)". Where
-- the new title already exists below `places` (made since), the `at` links go to
-- it and the old node goes.
CREATE TEMP TABLE place_rename (old_id INTEGER, new_title TEXT, dup_id INTEGER);

INSERT INTO place_rename (old_id, new_title, dup_id)
WITH r (old_title, new_title) AS (VALUES ('Zürich', 'Zürich (ZH)'), ('Bern', 'Bern (BE)'), ('Basel', 'Basel (BS)'), ('Genève', 'Genève (GE)'), ('Luzern', 'Luzern (LU)'))
SELECT c.id, r.new_title,
       (SELECT d.id FROM node_links l2 JOIN nodes d ON d.id = l2.to_id
         WHERE l2.from_id = p.id AND l2.label = 'child' AND d.title = r.new_title)
  FROM nodes p
  JOIN node_links l ON l.from_id = p.id AND l.label = 'child'
  JOIN nodes c ON c.id = l.to_id
  JOIN r ON r.old_title = c.title
 WHERE p.title = 'places' AND p.kind = 'list';

UPDATE nodes
   SET title = (SELECT new_title FROM place_rename WHERE old_id = nodes.id),
       doc = json_set(doc, '$.title', (SELECT new_title FROM place_rename WHERE old_id = nodes.id))
 WHERE id IN (SELECT old_id FROM place_rename WHERE dup_id IS NULL);

UPDATE OR IGNORE node_links
   SET to_id = (SELECT dup_id FROM place_rename WHERE old_id = node_links.to_id)
 WHERE label = 'at' AND to_id IN (SELECT old_id FROM place_rename WHERE dup_id IS NOT NULL);

DELETE FROM nodes WHERE id IN (SELECT old_id FROM place_rename WHERE dup_id IS NOT NULL);

DROP TABLE place_rename;
