/import/ {s|[, ]\+css\([, ]\+\)|\1|g
s|[, ]\+Dropzone\([, ]\+\)|\1|g
s|[, ]\+getOrCreateStore\([, ]\+\)|\1|g
s|[, ]\+ImageList\([, ]\+\)|\1|g
s|[, ]\+RootStore\([, ]\+\)|\1|g
s|[, ]\+Util\([, ]\+\)|\1|g
}
/import.*{.*}.*from/ { s|\s*{\s*}\s*| |g ;; s|{,|{| ;; s|\s*,\s*from| from| }
s|^\s*import\s*,\s*|import |
\|^\s*import \s*from|d
