package io.github.ecvrakamanescript.azyron.core.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JsonTreeTest {
    @Test
    void readsAllValueTypes() throws JsonFormatException {
        Object value = JsonTree.parse("{\"text\": \"a\\\"b\", \"number\": 1.5, \"whole\": 344, \"negative\": -2e3,"
                + " \"on\": true, \"off\": false, \"nothing\": null, \"list\": [1, \"x\", {}], \"object\": {\"a\": []}}");

        Map<String, Object> expected = new LinkedHashMap<>();
        expected.put("text", "a\"b");
        expected.put("number", 1.5);
        expected.put("whole", 344.0);
        expected.put("negative", -2000.0);
        expected.put("on", true);
        expected.put("off", false);
        expected.put("nothing", null);
        expected.put("list", Arrays.asList(1.0, "x", Map.of()));
        expected.put("object", Map.of("a", List.of()));
        assertEquals(expected, value);
    }

    @Test
    void keepsTheOrderOfKeys() throws JsonFormatException {
        Map<?, ?> value = (Map<?, ?>) JsonTree.parse("{\"b\": 1, \"a\": 2, \"c\": 3}");

        assertEquals(List.of("b", "a", "c"), List.copyOf(value.keySet()));
    }

    @Test
    void lastDuplicateKeyWins() throws JsonFormatException {
        assertEquals(Map.of("a", 2.0), JsonTree.parse("{\"a\": 1, \"a\": 2}"));
    }

    @Test
    void readsNumbersTooLargeForADoubleAsInfinity() throws JsonFormatException {
        assertEquals(Map.of("a", Double.POSITIVE_INFINITY), JsonTree.parse("{\"a\": 1e400}"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "",
            "   ",
            "{",
            "{\"a\": }",
            "{\"a\": 1,}",
            "{\"a\" 1}",
            "{a: 1}",
            "{'a': 1}",
            "{\"a\": 1} {\"b\": 2}",
            "{\"a\": 1} x",
            "{\"a\": NaN}",
            "{\"a\": tru}",
            "[1, 2",
            "// comment\n{}"
    })
    void rejectsInvalidJson(String json) {
        assertThrows(JsonFormatException.class, () -> JsonTree.parse(json));
    }

    @Test
    void acceptsNestingUpToTheLimit() throws JsonFormatException {
        String json = "[".repeat(JsonTree.MAX_DEPTH) + "]".repeat(JsonTree.MAX_DEPTH);

        assertTrue(JsonTree.parse(json) instanceof List);
    }

    @Test
    void rejectsDeeperNesting() {
        String json = "[".repeat(JsonTree.MAX_DEPTH + 1) + "]".repeat(JsonTree.MAX_DEPTH + 1);
        String veryDeep = "[".repeat(100_000) + "]".repeat(100_000);

        assertThrows(JsonFormatException.class, () -> JsonTree.parse(json));
        assertThrows(JsonFormatException.class, () -> JsonTree.parse(veryDeep));
    }
}
