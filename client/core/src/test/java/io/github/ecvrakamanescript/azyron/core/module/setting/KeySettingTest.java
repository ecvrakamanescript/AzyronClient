package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KeySettingTest {
    /** GLFW_KEY_RIGHT_SHIFT */
    private static final int RIGHT_SHIFT = 344;
    /** GLFW_KEY_C */
    private static final int C = 67;

    @Test
    void storesAKey() {
        KeySetting setting = new KeySetting("zoom_key", C);

        assertEquals(C, setting.get());
        assertTrue(setting.isBound());

        setting.set(RIGHT_SHIFT);
        assertEquals(RIGHT_SHIFT, setting.get());
    }

    @Test
    void canHaveNoKey() {
        KeySetting unbound = new KeySetting("zoom_key", KeySetting.NONE);
        assertFalse(unbound.isBound());

        KeySetting setting = new KeySetting("zoom_key", C);
        setting.clear();
        assertEquals(KeySetting.NONE, setting.get());
        assertFalse(setting.isBound());
    }

    @ParameterizedTest
    @ValueSource(ints = {KeySetting.FIRST_KEY, KeySetting.LAST_KEY})
    void acceptsTheFirstAndLastKey(int key) {
        assertEquals(key, new KeySetting("zoom_key", key).get());
    }

    @ParameterizedTest
    @ValueSource(ints = {-2, 0, 31, 349, 1000, Integer.MIN_VALUE, Integer.MAX_VALUE})
    void rejectsInvalidKeyCodes(int key) {
        assertThrows(IllegalArgumentException.class, () -> new KeySetting("zoom_key", key));

        KeySetting setting = new KeySetting("zoom_key", C);
        assertThrows(IllegalArgumentException.class, () -> setting.set(key));
        assertEquals(C, setting.get());
    }
}
