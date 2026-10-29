package io.github.ecvrakamanescript.azyron.core.ui;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.SortedSet;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UiBasicsTest {
    @ParameterizedTest
    @CsvSource({
            "1920, 1080, 1",
            "1280, 720, 1",
            "800, 600, 1",
            "2560, 1440, 1.25",
            "2560, 1080, 1",
            "3440, 1440, 1.25",
            "2880, 1620, 1.5",
            "3840, 2160, 2",
            "3840, 2100, 1.75",
            "5120, 2880, 2.5",
            "7680, 4320, 3"
    })
    void scaleFollowsTheWindowInSteps(int width, int height, float expected) {
        assertEquals(expected, UiScale.forWindow(width, height));
    }

    @Test
    void colorHelpers() {
        assertEquals(0xFF102030, Colors.rgb(0x102030));
        assertEquals(0x80102030, Colors.withOpacity(0xFF102030, 0.5f));
        assertEquals(0x40102030, Colors.multiplyAlpha(0x80102030, 0.5f));
        assertEquals(0xFF000000, Colors.mix(0xFF000000, 0xFFFFFFFF, 0));
        assertEquals(0xFF808080, Colors.mix(0xFF000000, 0xFFFFFFFF, 0.5f));
        assertEquals(0x00FFFFFF, Colors.mix(0xFFFFFFFF, 0x00FFFFFF, 2));
        assertEquals(0xFF000000, Colors.argb(300, -5, 0, 0));
    }

    @Test
    void themesMatchTheLauncher() {
        assertSame(Theme.DARK, Theme.byId("dark"));
        assertSame(Theme.LIGHT, Theme.byId("light"));
        assertSame(Theme.AMOLED, Theme.byId("amoled"));
        assertSame(Theme.DARK, Theme.byId("unknown"));
        assertSame(Theme.DARK, Theme.byId(null));
        assertEquals(0xFF8B5CF6, Theme.DARK.accent);
        assertEquals(0xFF000000, Theme.AMOLED.surface);
    }

    @Test
    void catalogContainsEveryStyleAtEveryScale() {
        SortedSet<FontKey> fonts = FontCatalog.all();

        for (TextStyle style : TextStyle.values()) {
            for (float scale : UiScale.STEPS) {
                assertTrue(fonts.contains(style.font(scale)), style + " at " + scale);
            }
        }
        // Shared sizes are only listed once
        assertTrue(fonts.size() < TextStyle.values().length * UiScale.STEPS.length);
    }

    @Test
    void writesOneDefinitionPerFont(@TempDir Path directory) throws IOException {
        FontCatalog.main(new String[] {directory.resolve("font").toString()});

        try (Stream<Path> files = Files.list(directory.resolve("font"))) {
            assertEquals(FontCatalog.all().size(), files.count());
        }
        String body = new String(Files.readAllBytes(directory.resolve("font").resolve("semibold_26.json")),
                StandardCharsets.UTF_8);
        assertTrue(body.contains("\"file\": \"azyronclient:inter/inter-semibold.ttf\""), body);
        assertTrue(body.contains("\"size\": 26.0"), body);
        assertTrue(body.contains("\"oversample\": 1.0"), body);
        assertThrows(IllegalArgumentException.class, () -> FontCatalog.main(new String[0]));
    }

    @Test
    void fontKeys() {
        assertEquals("regular_13", TextStyle.BODY.font(1).id());
        assertEquals("semibold_23", TextStyle.TITLE.font(1.25f).id());
        assertThrows(IllegalArgumentException.class, () -> new FontKey(FontWeight.REGULAR, 0));
    }
}
