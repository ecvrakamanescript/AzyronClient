package io.github.ecvrakamanescript.azyron.core.ui;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.Locale;
import java.util.SortedSet;
import java.util.TreeSet;

/**
 * All fonts the UI needs: every text style at every UI scale. The build writes one Minecraft font
 * definition per font with {@link #main}, so the list exists only here.
 */
public final class FontCatalog {
    private FontCatalog() {
    }

    public static SortedSet<FontKey> all() {
        SortedSet<FontKey> fonts = new TreeSet<>();
        for (TextStyle style : TextStyle.values()) {
            for (float scale : UiScale.STEPS) {
                fonts.add(style.font(scale));
            }
        }
        return Collections.unmodifiableSortedSet(fonts);
    }

    /** Font file of a weight in the Minecraft resources. */
    public static String fontFile(FontWeight weight) {
        return "azyronclient:inter/inter-" + weight.id + ".ttf";
    }

    /**
     * Minecraft font definition: the TrueType file at the exact pixel size without oversampling,
     * so one glyph pixel is one screen pixel. Missing characters fall back to the default font.
     */
    public static String definition(FontKey font) {
        return String.format(Locale.ROOT,
                "{\n  \"providers\": [\n"
                        + "    {\"type\": \"ttf\", \"file\": \"%s\", \"size\": %d.0, \"oversample\": 1.0},\n"
                        + "    {\"type\": \"reference\", \"id\": \"minecraft:default\"}\n"
                        + "  ]\n}\n",
                fontFile(font.weight), font.pixelSize);
    }

    /** Writes the font definitions into the directory given as the only argument (used by the build). */
    public static void main(String[] args) throws IOException {
        if (args.length != 1) {
            throw new IllegalArgumentException("Usage: FontCatalog <output directory>");
        }
        Path directory = Paths.get(args[0]);
        Files.createDirectories(directory);
        for (FontKey font : all()) {
            try (Writer out = Files.newBufferedWriter(directory.resolve(font.id() + ".json"), StandardCharsets.UTF_8)) {
                out.write(definition(font));
            }
        }
    }
}
