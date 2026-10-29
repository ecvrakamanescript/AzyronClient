package io.github.ecvrakamanescript.azyron.core.config;

import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * The configuration file azyronclient.json with the state and settings of all modules.
 * Load it after all modules are registered and before {@link ModuleManager#start}, so that no
 * module hooks run while the values are applied.
 */
public final class ConfigFile {
    public static final String FILE_NAME = "azyronclient.json";
    /** Larger files are treated as damaged; a normal file has a few kilobytes. */
    static final long MAX_SIZE = 1024 * 1024;
    /** Byte order mark that some editors write at the start of a UTF-8 file. */
    private static final char BOM = '﻿';

    private final Path file;

    /** @param directory the config directory of the game, for example .minecraft/config */
    public ConfigFile(Path directory) {
        this.file = Objects.requireNonNull(directory, "directory").resolve(FILE_NAME);
    }

    public Path path() {
        return file;
    }

    /** Where a damaged file is moved to, so that its content is not lost. */
    public Path backupPath() {
        return file.resolveSibling(FILE_NAME + ".broken");
    }

    /** Loads the file into the modules. Never throws because of a missing or damaged file. */
    public LoadResult load(ModuleManager manager) {
        Objects.requireNonNull(manager, "manager");
        if (!Files.exists(file)) {
            return new LoadResult(LoadResult.Status.MISSING, Collections.<String>emptyList());
        }
        String content;
        try {
            if (Files.size(file) > MAX_SIZE) {
                return backUp("The file is larger than " + MAX_SIZE + " bytes");
            }
            content = new String(Files.readAllBytes(file), StandardCharsets.UTF_8);
        } catch (IOException e) {
            return new LoadResult(LoadResult.Status.UNREADABLE, Collections.singletonList("Could not read " + file + ": " + e));
        }
        if (!content.isEmpty() && content.charAt(0) == BOM) {
            content = content.substring(1);
        }

        Object root;
        try {
            root = JsonTree.parse(content);
        } catch (JsonFormatException e) {
            return backUp("Invalid JSON: " + e.getMessage());
        }
        if (!(root instanceof Map)) {
            return backUp("The file does not contain a JSON object");
        }
        List<String> warnings = new ArrayList<>();
        @SuppressWarnings("unchecked")
        Map<String, Object> object = (Map<String, Object>) root;
        ConfigJson.apply(object, manager, warnings);
        return new LoadResult(LoadResult.Status.LOADED, warnings);
    }

    /**
     * Writes all modules to the file. Writes a temporary file first and then replaces the old file,
     * so the old file stays intact if the game stops while writing.
     */
    public void save(ModuleManager manager) throws IOException {
        Objects.requireNonNull(manager, "manager");
        Path directory = file.getParent();
        if (directory != null) {
            Files.createDirectories(directory);
        }
        Path temp = file.resolveSibling(FILE_NAME + ".tmp");
        try {
            try (Writer out = Files.newBufferedWriter(temp, StandardCharsets.UTF_8)) {
                ConfigJson.write(out, manager);
            }
            try {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    private LoadResult backUp(String reason) {
        List<String> warnings = new ArrayList<>();
        warnings.add(reason);
        try {
            Files.move(file, backupPath(), StandardCopyOption.REPLACE_EXISTING);
            warnings.add("Moved the damaged file to " + backupPath() + ", using default values");
            return new LoadResult(LoadResult.Status.BROKEN, warnings);
        } catch (IOException e) {
            warnings.add("Could not move the damaged file to " + backupPath() + ": " + e);
            return new LoadResult(LoadResult.Status.UNREADABLE, warnings);
        }
    }
}
