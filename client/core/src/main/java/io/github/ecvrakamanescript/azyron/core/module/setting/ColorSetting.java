package io.github.ecvrakamanescript.azyron.core.module.setting;

/**
 * A color as ARGB (0xAARRGGBB). If transparency is not allowed, the alpha channel is always
 * set to 0xFF, so a value like 0x7C3AED becomes 0xFF7C3AED.
 */
public final class ColorSetting extends Setting<Integer> {
    private static final int OPAQUE = 0xFF000000;

    private final boolean allowsAlpha;

    public ColorSetting(String id, int defaultArgb, boolean allowsAlpha) {
        super(id, allowsAlpha ? defaultArgb : defaultArgb | OPAQUE);
        this.allowsAlpha = allowsAlpha;
    }

    public boolean allowsAlpha() {
        return allowsAlpha;
    }

    @Override
    protected Integer normalize(Integer value) {
        return allowsAlpha ? value : value | OPAQUE;
    }
}
