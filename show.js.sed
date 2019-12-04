/import/ {s|[, ]\+Alea\([, ]\+\)|\1|g
s|[, ]\+getOrCreateStore\([, ]\+\)|\1|g
s|[, ]\+HSLA\([, ]\+\)|\1|g
s|[, ]\+ImageList\([, ]\+\)|\1|g
s|[, ]\+lazyInitializer\([, ]\+\)|\1|g
s|[, ]\+randomImagePaths\([, ]\+\)|\1|g
s|[, ]\+RootStore\([, ]\+\)|\1|g
s|[, ]\+ScrollController\([, ]\+\)|\1|g
s|[, ]\+SwipeTracker\([, ]\+\)|\1|g
s|[, ]\+Util\([, ]\+\)|\1|g
}
/import.*{.*}.*from/ { s|\s*{\s*}\s*| |g ;; s|{,|{| ;; s|\s*,\s*from| from| }
s|^\s*import\s*,\s*|import |
\|^\s*import \s*from|d
