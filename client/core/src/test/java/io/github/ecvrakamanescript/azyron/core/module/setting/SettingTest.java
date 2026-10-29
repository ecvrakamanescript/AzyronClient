package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Behaviour shared by all settings, tested with the simplest one. */
class SettingTest {
    @Test
    void startsWithTheDefaultValue() {
        BooleanSetting setting = new BooleanSetting("shadow", true);

        assertEquals("shadow", setting.id());
        assertTrue(setting.get());
        assertTrue(setting.defaultValue());
        assertTrue(setting.isDefault());
    }

    @Test
    void rejectsInvalidIds() {
        assertThrows(IllegalArgumentException.class, () -> new BooleanSetting("Shadow", true));
        assertThrows(IllegalArgumentException.class, () -> new BooleanSetting(null, true));
    }

    @Test
    void setsAndResetsTheValue() {
        BooleanSetting setting = new BooleanSetting("shadow", true);

        setting.set(false);
        assertFalse(setting.get());
        assertFalse(setting.isDefault());

        setting.reset();
        assertTrue(setting.get());
        assertTrue(setting.isDefault());
    }

    @Test
    void rejectsNull() {
        BooleanSetting setting = new BooleanSetting("shadow", true);

        assertThrows(NullPointerException.class, () -> setting.set(null));
        assertThrows(NullPointerException.class, () -> setting.addListener(null));
        assertTrue(setting.get());
    }

    @Test
    void notifiesListenersWithOldAndNewValue() {
        BooleanSetting setting = new BooleanSetting("shadow", true);
        List<String> events = new ArrayList<>();
        setting.addListener((oldValue, newValue) -> events.add(oldValue + "->" + newValue));

        setting.toggle();
        setting.set(false);
        setting.reset();

        // Setting the same value again does not notify
        assertEquals(List.of("true->false", "false->true"), events);
    }

    @Test
    void removedListenerIsNotCalled() {
        BooleanSetting setting = new BooleanSetting("shadow", true);
        List<Boolean> events = new ArrayList<>();
        Setting.Listener<Boolean> listener = (oldValue, newValue) -> events.add(newValue);
        setting.addListener(listener);
        setting.removeListener(listener);

        setting.toggle();

        assertTrue(events.isEmpty());
    }

    @Test
    void listenerCanRemoveItselfWhileCalled() {
        BooleanSetting setting = new BooleanSetting("shadow", true);
        List<String> events = new ArrayList<>();
        setting.addListener(new Setting.Listener<Boolean>() {
            @Override
            public void changed(Boolean oldValue, Boolean newValue) {
                events.add("once");
                setting.removeListener(this);
            }
        });
        setting.addListener((oldValue, newValue) -> events.add("always"));

        setting.toggle();
        setting.toggle();

        assertEquals(List.of("once", "always", "always"), events);
    }

    @Test
    void listenerForAWiderTypeIsAccepted() {
        NumberSetting setting = new NumberSetting("scale", 1, 0, 2, 0.5);
        List<Object> events = new ArrayList<>();
        Setting.Listener<Object> listener = (oldValue, newValue) -> events.add(newValue);
        setting.addListener(listener);

        setting.set(1.5);

        assertEquals(List.of(1.5), events);
    }
}
