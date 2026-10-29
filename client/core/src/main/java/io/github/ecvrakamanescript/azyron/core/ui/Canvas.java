package io.github.ecvrakamanescript.azyron.core.ui;

/**
 * Drawing surface of the client UI in real screen pixels. Each Minecraft version provides a small
 * subclass for the few primitives; shapes, opacity and text layout are the same everywhere.
 * <p>
 * Coordinates are whole pixels, which keeps edges sharp at every UI scale. Animations that move or
 * grow something by fractions of a pixel use {@link #pushTransform}.
 */
public abstract class Canvas {
    private static final int MAX_DEPTH = 32;

    private final float scale;
    private final float[] opacityStack = new float[MAX_DEPTH];
    private int opacityDepth;
    private float opacity = 1;

    protected Canvas(float scale) {
        this.scale = scale;
    }

    /** UI scale, see {@link UiScale}. */
    public final float scale() {
        return scale;
    }

    /** A length of the design (at scale 1) in real pixels at the current scale. */
    public final int px(float designPixels) {
        return UiScale.px(designPixels, scale);
    }

    /** Width of the drawing area in real pixels. */
    public abstract int width();

    /** Height of the drawing area in real pixels. */
    public abstract int height();

    public final void fill(int x, int y, int width, int height, int color) {
        if (width <= 0 || height <= 0) {
            return;
        }
        int shown = Colors.multiplyAlpha(color, opacity);
        if (Colors.alpha(shown) == 0) {
            return;
        }
        drawRect(x, y, x + width, y + height, shown);
    }

    /** Rectangle with rounded, smooth corners. The radius is limited to half of the shorter side. */
    public final void roundedRect(int x, int y, int width, int height, int radius, int color) {
        if (width <= 0 || height <= 0) {
            return;
        }
        int r = Math.min(radius, Math.min(width, height) / 2);
        if (r <= 0) {
            fill(x, y, width, height, color);
            return;
        }
        CornerMask mask = CornerMask.of(r);
        r = mask.radius;
        fill(x + r, y, width - 2 * r, height, color);
        fill(x, y + r, r, height - 2 * r, color);
        fill(x + width - r, y + r, r, height - 2 * r, color);
        int right = x + width;
        int bottom = y + height;
        for (CornerMask.Run run : mask.runs) {
            int runColor = run.coverage >= 1f ? color : Colors.multiplyAlpha(color, run.coverage);
            int left = x + run.column;
            int mirrored = right - run.column - run.length;
            fill(left, y + run.row, run.length, 1, runColor);
            fill(mirrored, y + run.row, run.length, 1, runColor);
            fill(left, bottom - 1 - run.row, run.length, 1, runColor);
            fill(mirrored, bottom - 1 - run.row, run.length, 1, runColor);
        }
    }

    /**
     * Text with its line box at (x, y); the line box is {@link #lineHeight} high and the text is
     * centred in it.
     */
    public final void text(String text, TextStyle style, int x, int y, int color) {
        if (text.isEmpty()) {
            return;
        }
        int shown = Colors.multiplyAlpha(color, opacity);
        // Minecraft treats colours with almost no alpha as opaque, so nearly invisible text is skipped
        if (Colors.alpha(shown) < 8) {
            return;
        }
        drawText(text, style.font(scale), x, y, lineHeight(style), shown);
    }

    /** Width of the text in real pixels. */
    public final int textWidth(String text, TextStyle style) {
        return text.isEmpty() ? 0 : measureText(text, style.font(scale));
    }

    /** Height of one line of the style in real pixels. */
    public final int lineHeight(TextStyle style) {
        return (int) Math.ceil(style.pixelSize(scale) * 1.3f);
    }

    /** Multiplies the opacity of everything drawn until {@link #popOpacity}. */
    public final void pushOpacity(float factor) {
        if (opacityDepth == MAX_DEPTH) {
            throw new IllegalStateException("Too many nested opacities");
        }
        opacityStack[opacityDepth++] = opacity;
        opacity *= Colors.clamp01(factor);
    }

    public final void popOpacity() {
        if (opacityDepth == 0) {
            throw new IllegalStateException("popOpacity without pushOpacity");
        }
        opacity = opacityStack[--opacityDepth];
    }

    /** Current opacity factor (0 to 1). */
    public final float opacity() {
        return opacity;
    }

    /** Moves and scales everything drawn until {@link #popTransform}; the scale is around (x, y). */
    public abstract void pushTransform(float x, float y, float scale);

    public abstract void popTransform();

    /** Limits drawing to the rectangle until {@link #popClip}. */
    public abstract void pushClip(int x, int y, int width, int height);

    public abstract void popClip();

    /** Fills the rectangle from (x1, y1) inclusive to (x2, y2) exclusive. */
    protected abstract void drawRect(int x1, int y1, int x2, int y2, int color);

    /** Draws the text vertically centred in the line box at (x, y) with the given height. */
    protected abstract void drawText(String text, FontKey font, int x, int y, int lineHeight, int color);

    protected abstract int measureText(String text, FontKey font);
}
