-- Hauls: first-class, isolated workspaces. Each haul owns its own hauler store
-- directory on disk, so multiple hauls can be built, edited, and served side by
-- side without clearing or merging a single shared store.
CREATE TABLE IF NOT EXISTS hauls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,    -- filesystem-safe identifier used for the store path
    description TEXT,
    store_dir TEXT NOT NULL,      -- absolute path to this haul's OCI store layout
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recreate store_contents scoped to a haul. Provenance is now exact (we know
-- which haul each item belongs to) instead of being reconstructed by matching
-- digests/names, so the uniqueness constraint includes haul_id.
--
-- DATA-SAFETY NOTE: The DROP below recreates store_contents with the new
-- haul_id column. On a FRESH install the table is empty, so nothing is lost.
-- However, upgrading an install that ALREADY had store_contents rows will
-- permanently DROP that data. This is a one-time destructive window that is
-- acceptable only because it happened during the alpha period. Do NOT edit this
-- statement (see docs/persistence.md "Migration Policy"): the migration is
-- already recorded as applied by version number and will not re-run, so
-- changing it here would silently diverge fresh installs from upgraded ones.
DROP TABLE IF EXISTS store_contents;
CREATE TABLE store_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    haul_id INTEGER,
    content_type TEXT NOT NULL,  -- 'image', 'chart', 'file'
    name TEXT NOT NULL,
    digest TEXT,
    source_haul TEXT,            -- archive filename an item was loaded from, if any
    loaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(haul_id, content_type, name, digest)
);
CREATE INDEX IF NOT EXISTS idx_store_contents_haul ON store_contents(haul_id);
CREATE INDEX IF NOT EXISTS idx_store_contents_type ON store_contents(content_type);

-- Associate background jobs and serve processes with the haul they operate on,
-- so job history and running servers can be filtered per haul.
ALTER TABLE jobs ADD COLUMN haul_id INTEGER;
ALTER TABLE serve_processes ADD COLUMN haul_id INTEGER;
