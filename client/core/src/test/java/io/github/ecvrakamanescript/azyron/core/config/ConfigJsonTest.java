package io.github.ecvrakamanescript.azyron.core.config;

import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ConfigJsonTest {
    private ModuleManager manager;
    private ExampleModule fps;
    private ExampleModule zoom;
    private List<String> warnings;

    @BeforeEach
    void setUp() {
        manager = new ModuleManager();
        fps = manager.register(new ExampleModule("fps", true));
        zoom = manager.register(new ExampleModule("zoom", false));
        warnings = new ArrayList<>();
    }

    private String write() throws IOException {
        StringWriter out = new StringWriter();
        ConfigJson.write(out, manager);
        return out.toString();
    }

    @SuppressWarnings("unchecked")
    private void apply(String json) throws JsonFormatException {
        ConfigJson.apply((Map<String, Object>) JsonTree.parse(json), manager, warnings);
    }

    @Test
    void writesAllModulesAndSettings() throws IOException {
        fps.scale.set(1.5);
        fps.key.clear();

        String expected = String.join("\n",
                "{",
                "  \"version\": 1,",
                "  \"modules\": {",
                "    \"fps\": {",
                "      \"enabled\": true,",
                "      \"settings\": {",
                "        \"shadow\": true,",
                "        \"scale\": 1.5,",
                "        \"color\": \"#FF7C3AED\",",
                "        \"background\": \"#80000000\",",
                "        \"key\": \"key.keyboard.unknown\",",
                "        \"mode\": \"smooth\"",
                "      }",
                "    },",
                "    \"zoom\": {",
                "      \"enabled\": false,",
                "      \"settings\": {",
                "        \"shadow\": true,",
                "        \"scale\": 1.0,",
                "        \"color\": \"#FF7C3AED\",",
                "        \"background\": \"#80000000\",",
                "        \"key\": \"key.keyboard.c\",",
                "        \"mode\": \"smooth\"",
                "      }",
                "    }",
                "  }",
                "}",
                "");
        assertEquals(expected, write());
    }

    @Test
    void writesAnEmptyModuleList() throws IOException {
        ModuleManager empty = new ModuleManager();
        StringWriter out = new StringWriter();

        ConfigJson.write(out, empty);

        assertEquals("{\n  \"version\": 1,\n  \"modules\": {}\n}\n", out.toString());
    }

    @Test
    void savedValuesAreLoadedAgain() throws IOException, JsonFormatException {
        fps.setEnabled(false);
        zoom.setEnabled(true);
        fps.shadow.set(false);
        fps.scale.set(0.7);
        fps.color.set(0xFF123456);
        fps.background.set(0x00FFFFFF);
        fps.key.set("key.mouse.4");
        fps.mode.set("instant");
        String json = write();

        setUp();
        apply(json);

        assertTrue(warnings.isEmpty(), warnings.toString());
        assertFalse(fps.isEnabled());
        assertTrue(zoom.isEnabled());
        assertFalse(fps.shadow.get());
        assertEquals(0.7, fps.scale.get());
        assertEquals(0xFF123456, fps.color.get());
        assertEquals(0x00FFFFFF, fps.background.get());
        assertEquals("key.mouse.4", fps.key.get());
        assertEquals("instant", fps.mode.get());
        assertTrue(zoom.hasDefaultSettings());
    }

    @Test
    void missingEntriesKeepTheirDefaults() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"scale\": 2}}}}");

        assertTrue(warnings.isEmpty(), warnings.toString());
        assertTrue(fps.isEnabled());
        assertEquals(2.0, fps.scale.get());
        assertTrue(fps.shadow.get());
        assertFalse(zoom.isEnabled());
    }

    @Test
    void emptyObjectGivesOnlyAVersionWarning() throws JsonFormatException {
        apply("{}");

        assertEquals(List.of("Missing \"version\", reading the file as version 1"), warnings);
        assertTrue(fps.hasDefaultSettings());
    }

    @Test
    void warnsAboutOtherVersionsAndStillReadsTheFile() throws JsonFormatException {
        apply("{\"version\": 2, \"modules\": {\"fps\": {\"enabled\": false}}}");
        apply("{\"version\": \"1\"}");

        assertEquals(List.of(
                "Unsupported version 2, reading the file as version 1",
                "Unsupported version \"1\", reading the file as version 1"), warnings);
        assertFalse(fps.isEnabled());
    }

    @Test
    void ignoresUnknownEntries() throws JsonFormatException {
        apply("{\"version\": 1, \"extra\": 1, \"modules\": {\"old\": {}, \"fps\": {\"extra\": 1,"
                + " \"settings\": {\"old\": true, \"scale\": 1.5}}}}");

        assertEquals(List.of(
                "Unknown entry \"extra\" ignored",
                "modules.old: unknown module ignored",
                "modules.fps.extra: unknown entry ignored",
                "modules.fps.settings.old: unknown setting ignored"), warnings);
        assertEquals(1.5, fps.scale.get());
    }

    @Test
    void wrongStructureUsesDefaults() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": []}");
        apply("{\"version\": 1, \"modules\": {\"fps\": true, \"zoom\": {\"settings\": null}}}");

        assertEquals(List.of(
                "modules: expected an object but found an array, using default values",
                "modules.fps: expected an object but found true, using default values",
                "modules.zoom.settings: expected an object but found null, using default values"), warnings);
        assertTrue(fps.isEnabled());
        assertTrue(fps.hasDefaultSettings());
    }

    @Test
    void invalidEnabledValueUsesTheDefault() throws JsonFormatException {
        fps.setEnabled(false);

        apply("{\"version\": 1, \"modules\": {\"fps\": {\"enabled\": \"yes\"}}}");

        assertEquals(List.of("modules.fps.enabled: invalid value \"yes\", using the default value"), warnings);
        assertTrue(fps.isEnabled());
    }

    @Test
    void invalidSettingValuesUseTheDefault() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {"
                + "\"shadow\": 1, \"scale\": \"big\", \"color\": \"red\", \"background\": \"#12345\","
                + " \"key\": 67, \"mode\": 3}}}}");

        assertEquals(List.of(
                "modules.fps.settings.shadow: invalid value 1, using the default value",
                "modules.fps.settings.scale: invalid value \"big\", using the default value",
                "modules.fps.settings.color: invalid value \"red\", using the default value",
                "modules.fps.settings.background: invalid value \"#12345\", using the default value",
                "modules.fps.settings.key: invalid value 67, using the default value",
                "modules.fps.settings.mode: invalid value 3, using the default value"), warnings);
        assertTrue(fps.hasDefaultSettings());
    }

    @Test
    void valuesRejectedBySettingsUseTheDefault() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"key\": \"right shift\", \"mode\": \"fast\", \"scale\": 1e400}}}}");

        assertEquals(List.of(
                "modules.fps.settings.key: Invalid key name: \"right shift\", using the default value",
                "modules.fps.settings.mode: Unknown option: \"fast\", using the default value",
                "modules.fps.settings.scale: invalid value Infinity, using the default value"), warnings);
        assertTrue(fps.hasDefaultSettings());
    }

    @Test
    void invalidValueReplacesAValueSetBefore() throws JsonFormatException {
        fps.mode.set("instant");

        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"mode\": \"fast\"}}}}");

        assertEquals("smooth", fps.mode.get());
    }

    @Test
    void numbersOutsideTheRangeAreClamped() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"scale\": 99}}}}");

        assertTrue(warnings.isEmpty(), warnings.toString());
        assertEquals(2.0, fps.scale.get());
    }

    @Test
    void readsColorsWithAndWithoutAlpha() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"color\": \"#00ff00\", \"background\": \"#ffFFffFF\"}},"
                + " \"zoom\": {\"settings\": {\"color\": \"#00123456\", \"background\": \"#123456\"}}}}");

        assertTrue(warnings.isEmpty(), warnings.toString());
        assertEquals(0xFF00FF00, fps.color.get());
        assertEquals(0xFFFFFFFF, fps.background.get());
        // Without transparency the alpha channel is always 0xFF
        assertEquals(0xFF123456, zoom.color.get());
        assertEquals(0xFF123456, zoom.background.get());
    }

    @Test
    void readsKeysAndMouseButtons() throws JsonFormatException {
        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"key\": \"key.keyboard.right.shift\"}},"
                + " \"zoom\": {\"settings\": {\"key\": \"key.keyboard.unknown\"}}}}");

        assertTrue(warnings.isEmpty(), warnings.toString());
        assertEquals("key.keyboard.right.shift", fps.key.get());
        assertFalse(zoom.key.isBound());

        apply("{\"version\": 1, \"modules\": {\"fps\": {\"settings\": {\"key\": \"key.mouse.5\"}}}}");
        assertEquals("key.mouse.5", fps.key.get());
    }
}
