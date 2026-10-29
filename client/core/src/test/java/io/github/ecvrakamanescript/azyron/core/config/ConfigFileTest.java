package io.github.ecvrakamanescript.azyron.core.config;

import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConfigFileTest {
    @TempDir
    Path directory;

    private ConfigFile config;
    private ModuleManager manager;
    private ExampleModule fps;

    @BeforeEach
    void setUp() {
        config = new ConfigFile(directory.resolve("config"));
        manager = new ModuleManager();
        fps = manager.register(new ExampleModule("fps", true));
    }

    private void writeFile(String content) throws IOException {
        Files.createDirectories(config.path().getParent());
        Files.write(config.path(), content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void usesTheFileNameInTheGivenDirectory() {
        assertEquals(directory.resolve("config").resolve("azyronclient.json"), config.path());
        assertEquals(directory.resolve("config").resolve("azyronclient.json.broken"), config.backupPath());
    }

    @Test
    void missingFileGivesDefaults() {
        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.MISSING, result.status());
        assertTrue(result.warnings().isEmpty());
        assertTrue(result.canSave());
        assertTrue(fps.hasDefaultSettings());
        // Loading does not create the file
        assertFalse(Files.exists(config.path()));
    }

    @Test
    void saveCreatesTheDirectoryAndLeavesNoTemporaryFile() throws IOException {
        config.save(manager);

        assertTrue(Files.isRegularFile(config.path()));
        try (Stream<Path> files = Files.list(config.path().getParent())) {
            assertEquals(1, files.count());
        }
    }

    @Test
    void savedFileIsLoadedAgain() throws IOException {
        fps.setEnabled(false);
        fps.scale.set(1.8);
        config.save(manager);

        setUp();
        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.LOADED, result.status());
        assertTrue(result.warnings().isEmpty(), result.warnings().toString());
        assertFalse(fps.isEnabled());
        assertEquals(1.8, fps.scale.get());
    }

    @Test
    void saveReplacesTheOldFile() throws IOException {
        config.save(manager);
        fps.mode.set("instant");

        config.save(manager);

        String content = new String(Files.readAllBytes(config.path()), StandardCharsets.UTF_8);
        assertTrue(content.contains("\"mode\": \"instant\""), content);
    }

    @Test
    void writesUtf8WithoutByteOrderMark() throws IOException {
        config.save(manager);

        byte[] bytes = Files.readAllBytes(config.path());
        assertEquals('{', bytes[0]);
    }

    @Test
    void readsAFileWithByteOrderMark() throws IOException {
        writeFile("﻿{\"version\": 1, \"modules\": {\"fps\": {\"enabled\": false}}}");

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.LOADED, result.status());
        assertFalse(fps.isEnabled());
    }

    @Test
    void loadedFileReportsWarnings() throws IOException {
        writeFile("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"mode\": \"fast\"}}}}");

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.LOADED, result.status());
        assertEquals(1, result.warnings().size());
        assertTrue(result.canSave());
    }

    @Test
    void damagedFileIsMovedToTheBackup() throws IOException {
        String damaged = "{\"version\": 1, \"modules\": {\"fps\": {\"enabled\": false";
        writeFile(damaged);

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.BROKEN, result.status());
        assertTrue(result.canSave());
        assertTrue(result.warnings().get(0).startsWith("Invalid JSON: "), result.warnings().toString());
        assertFalse(Files.exists(config.path()));
        assertEquals(damaged, new String(Files.readAllBytes(config.backupPath()), StandardCharsets.UTF_8));
        assertTrue(fps.isEnabled());
    }

    @Test
    void fileWithoutAnObjectIsTreatedAsDamaged() throws IOException {
        writeFile("[1, 2, 3]");

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.BROKEN, result.status());
        assertEquals("The file does not contain a JSON object", result.warnings().get(0));
        assertTrue(Files.exists(config.backupPath()));
    }

    @Test
    void emptyFileIsTreatedAsDamaged() throws IOException {
        writeFile("");

        assertEquals(LoadResult.Status.BROKEN, config.load(manager).status());
    }

    @Test
    void newBackupReplacesAnOlderOne() throws IOException {
        writeFile("old");
        config.load(manager);
        writeFile("new");

        config.load(manager);

        assertEquals("new", new String(Files.readAllBytes(config.backupPath()), StandardCharsets.UTF_8));
    }

    @Test
    void tooLargeFileIsTreatedAsDamaged() throws IOException {
        char[] spaces = new char[(int) ConfigFile.MAX_SIZE];
        Arrays.fill(spaces, ' ');
        writeFile("{}" + new String(spaces));

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.BROKEN, result.status());
        assertTrue(result.warnings().get(0).startsWith("The file is larger than"), result.warnings().toString());
    }

    @Test
    void unreadableFileMustNotBeSaved() throws IOException {
        // A directory with the name of the file cannot be read as a file
        Files.createDirectories(config.path());

        LoadResult result = config.load(manager);

        assertEquals(LoadResult.Status.UNREADABLE, result.status());
        assertFalse(result.canSave());
        assertTrue(result.warnings().get(0).startsWith("Could not read"), result.warnings().toString());
        assertTrue(Files.isDirectory(config.path()));
    }
}
