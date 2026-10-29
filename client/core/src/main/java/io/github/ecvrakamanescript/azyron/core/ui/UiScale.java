package io.github.ecvrakamanescript.azyron.core.ui;

/**
 * Size of the client UI in real screen pixels. The UI is designed for a 1920 x 1080 window
 * (scale 1) and grows in fixed steps with the window, for example 2 on a 3840 x 2160 screen.
 * <p>
 * The steps are fixed, because every text size needs its own font (see {@link FontCatalog}):
 * Minecraft draws font glyphs without smoothing, so text is only sharp at its exact pixel size.
 */
public final class UiScale {
    /** Allowed scales, smallest first. */
    static final float[] STEPS = {1f, 1.25f, 1.5f, 1.75f, 2f, 2.5f, 3f};

    private static final int DESIGN_WIDTH = 1920;
    private static final int DESIGN_HEIGHT = 1080;

    private UiScale() {
    }

    /**
     * The largest step at which the design size still fits into the window, at least 1.
     * Sizes are in real pixels (the framebuffer size), not in Minecraft's scaled GUI units.
     */
    public static float forWindow(int width, int height) {
        float raw = Math.min(width / (float) DESIGN_WIDTH, height / (float) DESIGN_HEIGHT);
        float scale = STEPS[0];
        for (float step : STEPS) {
            if (step <= raw + 1e-4f) {
                scale = step;
            }
        }
        return scale;
    }

    /** A length of the design (at scale 1) in real pixels. */
    public static int px(float designPixels, float scale) {
        return Math.round(designPixels * scale);
    }
}
