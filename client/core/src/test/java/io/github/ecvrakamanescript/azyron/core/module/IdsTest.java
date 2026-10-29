package io.github.ecvrakamanescript.azyron.core.module;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IdsTest {
    @ParameterizedTest
    @ValueSource(strings = {"a", "fps", "key_strokes", "armor2", "a_", "abcdefghijklmnopqrstuvwxyz012345"})
    void acceptsValidIds(String id) {
        assertTrue(Ids.isValid(id));
        assertEquals(id, Ids.requireValid(id, "module"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Fps", "FPS", "1fps", "_fps", "fps-x", "fps x", " fps", "fps.x", "ä", "abcdefghijklmnopqrstuvwxyz0123456"})
    void rejectsInvalidIds(String id) {
        assertFalse(Ids.isValid(id));
        assertThrows(IllegalArgumentException.class, () -> Ids.requireValid(id, "module"));
    }

    @Test
    void namesTheKindAndIdInTheMessage() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> Ids.requireValid("Fps", "setting"));
        assertEquals("Invalid setting id: \"Fps\"", error.getMessage());
    }
}
