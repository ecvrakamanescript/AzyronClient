package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ColorSettingTest {
    @Test
    void opaqueColorAlwaysHasFullAlpha() {
        ColorSetting setting = new ColorSetting("color", 0x7C3AED, false);

        assertFalse(setting.allowsAlpha());
        assertEquals(0xFF7C3AED, setting.get());
        assertEquals(0xFF7C3AED, setting.defaultValue());

        setting.set(0x80FFFFFF);
        assertEquals(0xFFFFFFFF, setting.get());
        setting.set(0x00000000);
        assertEquals(0xFF000000, setting.get());
    }

    @Test
    void transparentColorKeepsAlpha() {
        ColorSetting setting = new ColorSetting("background", 0x80000000, true);

        assertTrue(setting.allowsAlpha());
        assertEquals(0x80000000, setting.get());

        setting.set(0x00FFFFFF);
        assertEquals(0x00FFFFFF, setting.get());
    }

    @Test
    void resetRestoresTheColor() {
        ColorSetting setting = new ColorSetting("color", 0xFF7C3AED, false);

        setting.set(0xFF000000);
        setting.reset();

        assertEquals(0xFF7C3AED, setting.get());
        assertTrue(setting.isDefault());
    }
}
