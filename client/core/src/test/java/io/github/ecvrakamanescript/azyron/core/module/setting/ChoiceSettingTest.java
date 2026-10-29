package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ChoiceSettingTest {
    @Test
    void storesOneOfTheOptions() {
        ChoiceSetting setting = new ChoiceSetting("mode", "smooth", "smooth", "instant");

        assertEquals("smooth", setting.get());
        assertEquals(List.of("smooth", "instant"), setting.options());

        setting.set("instant");
        assertEquals("instant", setting.get());
    }

    @Test
    void rejectsUnknownOptions() {
        ChoiceSetting setting = new ChoiceSetting("mode", "smooth", "smooth", "instant");

        assertThrows(IllegalArgumentException.class, () -> setting.set("fast"));
        assertThrows(IllegalArgumentException.class, () -> setting.set("Smooth"));
        assertEquals("smooth", setting.get());
    }

    @Test
    void rejectsInvalidOptionLists() {
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", "smooth"));
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", "smooth", "smooth", "smooth"));
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", "smooth", "smooth", "Instant"));
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", "smooth", "smooth", null));
        assertThrows(NullPointerException.class, () -> new ChoiceSetting("mode", "smooth", (String[]) null));
    }

    @Test
    void rejectsADefaultThatIsNotAnOption() {
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", "fast", "smooth", "instant"));
        assertThrows(IllegalArgumentException.class, () -> new ChoiceSetting("mode", null, "smooth", "instant"));
    }

    @Test
    void optionsCannotBeChanged() {
        String[] options = {"smooth", "instant"};
        ChoiceSetting setting = new ChoiceSetting("mode", "smooth", options);

        options[1] = "fast";
        assertEquals(List.of("smooth", "instant"), setting.options());
        assertThrows(UnsupportedOperationException.class, () -> setting.options().add("fast"));
    }
}
