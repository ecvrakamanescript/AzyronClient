package io.github.ecvrakamanescript.azyron.core.module;

import java.util.Locale;

/** Groups the modules in the client menu. */
public enum ModuleCategory {
    HUD,
    PVP,
    PERFORMANCE,
    UTILITY;

    /** Lowercase id used in translation keys, for example "hud". */
    public String id() {
        return name().toLowerCase(Locale.ROOT);
    }
}
