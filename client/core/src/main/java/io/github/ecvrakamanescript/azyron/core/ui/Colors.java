package io.github.ecvrakamanescript.azyron.core.ui;

/** Helpers for colours stored as ARGB integers (0xAARRGGBB). */
public final class Colors {
    private Colors() {
    }

    public static int argb(int alpha, int red, int green, int blue) {
        return (clamp(alpha) << 24) | (clamp(red) << 16) | (clamp(green) << 8) | clamp(blue);
    }

    /** Opaque colour from 0xRRGGBB. */
    public static int rgb(int rgb) {
        return 0xFF000000 | (rgb & 0xFFFFFF);
    }

    public static int alpha(int color) {
        return color >>> 24;
    }

    /** The same colour with the given opacity (0 to 1). */
    public static int withOpacity(int color, float opacity) {
        return (Math.round(clamp01(opacity) * 255) << 24) | (color & 0xFFFFFF);
    }

    /** The colour with its own alpha multiplied by the factor (0 to 1). */
    public static int multiplyAlpha(int color, float factor) {
        int alpha = Math.round(alpha(color) * clamp01(factor));
        return (alpha << 24) | (color & 0xFFFFFF);
    }

    /** Mixes two colours, including alpha. Progress 0 gives the first, 1 the second colour. */
    public static int mix(int from, int to, float progress) {
        float t = clamp01(progress);
        return argb(
                lerp(alpha(from), alpha(to), t),
                lerp((from >> 16) & 0xFF, (to >> 16) & 0xFF, t),
                lerp((from >> 8) & 0xFF, (to >> 8) & 0xFF, t),
                lerp(from & 0xFF, to & 0xFF, t));
    }

    private static int lerp(int from, int to, float t) {
        return Math.round(from + (to - from) * t);
    }

    private static int clamp(int channel) {
        return Math.max(0, Math.min(255, channel));
    }

    static float clamp01(float value) {
        return Math.max(0, Math.min(1, value));
    }
}
