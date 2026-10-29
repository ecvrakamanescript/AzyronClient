package io.github.ecvrakamanescript.azyron.core.ui;

/**
 * Colours of one theme as ARGB. The values are the same as in the launcher
 * (launcher/src/renderer/src/styles/theme.css), so client and launcher look alike.
 */
public final class Theme {
    public static final Theme DARK = new Theme("dark",
            0xFF0E0B14, 0xFF141020, 0xFF1E182B, 0xFF2A2238,
            0xFFECE8F5, 0xFF8A83A0,
            0xFF8B5CF6, 0xFFA78BFA, 0x298B5CF6, 0xFFFFFFFF,
            0x59000000);

    public static final Theme LIGHT = new Theme("light",
            0xFFF5F3FA, 0xFFFFFFFF, 0xFFEBE7F3, 0xFFDDD7E8,
            0xFF1B1626, 0xFF5C5670,
            0xFF7C3AED, 0xFF6D28D9, 0x1F7C3AED, 0xFFFFFFFF,
            0x1A1B1626);

    /** Pure black surfaces, separated by borders; a faint accent glow instead of a dark shadow. */
    public static final Theme AMOLED = new Theme("amoled",
            0xFF000000, 0xFF000000, 0xFF15111D, 0xFF1F1A2A,
            0xFFECE8F5, 0xFF8F88A5,
            0xFF8B5CF6, 0xFFA78BFA, 0x2E8B5CF6, 0xFFFFFFFF,
            0x248B5CF6);

    public final String id;
    public final int background;
    public final int surface;
    public final int surfaceRaised;
    public final int border;
    public final int text;
    public final int textMuted;
    public final int accent;
    public final int accentHover;
    /** Accent with low opacity, for selected and hovered areas. */
    public final int accentSoft;
    /** Text on the accent colour. */
    public final int accentContrast;
    public final int shadow;

    private Theme(String id, int background, int surface, int surfaceRaised, int border, int text, int textMuted,
                  int accent, int accentHover, int accentSoft, int accentContrast, int shadow) {
        this.id = id;
        this.background = background;
        this.surface = surface;
        this.surfaceRaised = surfaceRaised;
        this.border = border;
        this.text = text;
        this.textMuted = textMuted;
        this.accent = accent;
        this.accentHover = accentHover;
        this.accentSoft = accentSoft;
        this.accentContrast = accentContrast;
        this.shadow = shadow;
    }

    /** The theme with this id, or the dark default theme for an unknown id. */
    public static Theme byId(String id) {
        if (LIGHT.id.equals(id)) {
            return LIGHT;
        }
        if (AMOLED.id.equals(id)) {
            return AMOLED;
        }
        return DARK;
    }
}
