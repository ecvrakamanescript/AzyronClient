package io.github.ecvrakamanescript.azyron.core.config;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** What happened when the configuration file was loaded. */
public final class LoadResult {
    public enum Status {
        /** There was no file; all modules have their default values. */
        MISSING,
        /** The file was loaded; problems with single entries are in the warnings. */
        LOADED,
        /** The file was damaged and has been moved to the backup file; all modules have their default values. */
        BROKEN,
        /** The file could not be read or moved; saving would overwrite it, so it must not be saved. */
        UNREADABLE
    }

    private final Status status;
    private final List<String> warnings;

    LoadResult(Status status, List<String> warnings) {
        this.status = status;
        this.warnings = Collections.unmodifiableList(new ArrayList<>(warnings));
    }

    public Status status() {
        return status;
    }

    /** Problems found while loading, in English, for the game log. */
    public List<String> warnings() {
        return warnings;
    }

    /** False if saving could destroy a file that could not be read. */
    public boolean canSave() {
        return status != Status.UNREADABLE;
    }
}
