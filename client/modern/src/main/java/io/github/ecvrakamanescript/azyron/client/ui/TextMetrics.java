package io.github.ecvrakamanescript.azyron.client.ui;

import io.github.ecvrakamanescript.azyron.core.ui.FontKey;

/**
 * Vertical placement of the UI fonts. Minecraft puts the baseline of TrueType text a fixed
 * distance below the y position it is drawn at, whatever the font size (measured in the game).
 * The text is placed so that its capital letters sit centred in the line box.
 */
final class TextMetrics {
    /** Distance from the drawing position to the baseline, in drawing units (real pixels here). */
    private static final int BASELINE = 7;
    /** Height of the capital letters of Inter, as a share of the font size. */
    private static final float CAP_HEIGHT = 0.727f;

    private TextMetrics() {
    }

    /** The y position to pass to Minecraft for text in the line box starting at lineTop. */
    static int drawY(FontKey font, int lineTop, int lineHeight) {
        float capHeight = font.pixelSize * CAP_HEIGHT;
        // Rounded up: the anti-aliased edges make the letters look about one pixel taller at the top
        return lineTop + (int) Math.ceil((lineHeight + capHeight) / 2f) - BASELINE;
    }
}
