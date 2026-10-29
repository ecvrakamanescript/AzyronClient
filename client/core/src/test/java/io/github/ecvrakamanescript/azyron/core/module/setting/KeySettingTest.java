package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KeySettingTest {
    private static final String C = "key.keyboard.c";
    private static final String RIGHT_SHIFT = "key.keyboard.right.shift";

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
    @ValueSource(strings = {
            "key.keyboard.a",
            "key.keyboard.0",
            "key.keyboard.f24",
            "key.keyboard.keypad.enter",
            "key.keyboard.left.control",
            "key.mouse.left",
            "key.mouse.4",
            "key.mouse.8"
    })
    void acceptsKeyboardKeysAndMouseButtons(String key) {
        assertEquals(key, new KeySetting("zoom_key", key).get());
    }

    @Test
    void acceptsNamesUpToTheMaximumLength() {
        String longest = "key.keyboard." + "a".repeat(KeySetting.MAX_LENGTH - "key.keyboard.".length());

        assertEquals(KeySetting.MAX_LENGTH, longest.length());
        assertTrue(KeySetting.isValidName(longest));
        assertFalse(KeySetting.isValidName(longest + "a"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "c",
            "67",
            "key.keyboard",
            "key.keyboard.",
            "key.keyboard..c",
            "key.keyboard.c.",
            "key.keyboard.C",
            "key.keyboard.right shift",
            "key.gamepad.a",
            "KEY.KEYBOARD.C",
            " key.keyboard.c"
    })
    void rejectsInvalidKeyNames(String key) {
        assertFalse(KeySetting.isValidName(key));
        assertThrows(IllegalArgumentException.class, () -> new KeySetting("zoom_key", key));

        KeySetting setting = new KeySetting("zoom_key", C);
        assertThrows(IllegalArgumentException.class, () -> setting.set(key));
        assertEquals(C, setting.get());
    }

    @Test
    void rejectsNull() {
        assertFalse(KeySetting.isValidName(null));
        assertThrows(RuntimeException.class, () -> new KeySetting("zoom_key", null));
    }
}
