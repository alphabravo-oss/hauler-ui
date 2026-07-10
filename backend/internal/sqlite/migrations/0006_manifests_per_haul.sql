-- Scope saved manifests to a haul so each workspace owns its own manifest
-- library. Manifest names are now unique per haul rather than globally.
--
-- DATA-SAFETY NOTE: The DROP below recreates saved_manifests with the new
-- haul_id column. On a FRESH install the table is empty, so nothing is lost.
-- However, upgrading an install that ALREADY had saved_manifests rows will
-- permanently DROP that data. This is a one-time destructive window that is
-- acceptable only because it happened during the alpha period. Do NOT edit this
-- statement (see docs/persistence.md "Migration Policy"): the migration is
-- already recorded as applied by version number and will not re-run, so
-- changing it here would silently diverge fresh installs from upgraded ones.
DROP TABLE IF EXISTS saved_manifests;
CREATE TABLE saved_manifests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    haul_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    yaml_content TEXT NOT NULL,
    tags TEXT, -- JSON array of tags
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(haul_id, name)
);
CREATE INDEX IF NOT EXISTS idx_saved_manifests_haul ON saved_manifests(haul_id);
