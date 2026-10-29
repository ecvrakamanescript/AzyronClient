package io.github.ecvrakamanescript.azyron.core.ui;

/** The text sizes of the client UI, at scale 1 in pixels. */
public enum TextStyle {
    /** Small secondary text, such as descriptions and values. */
    CAPTION(FontWeight.REGULAR, 11),
    BODY(FontWeight.REGULAR, 13),
    /** Names of modules, buttons and HUD values. */
    LABEL(FontWeight.SEMIBOLD, 13),
    TITLE(FontWeight.SEMIBOLD, 18);

    public final FontWeight weight;
    /** Font size at scale 1, in pixels. */
    public final int size;

    TextStyle(FontWeight weight, int size) {
        this.weight = weight;
        this.size = size;
    }

    /** Font size at the given UI scale, in real pixels. */
    public int pixelSize(float scale) {
        return UiScale.px(size, scale);
    }

    /** The font for this style at the given UI scale. */
    public FontKey font(float scale) {
        return new FontKey(weight, pixelSize(scale));
    }
}
