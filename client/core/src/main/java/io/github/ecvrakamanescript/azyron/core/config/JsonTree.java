package io.github.ecvrakamanescript.azyron.core.config;

import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;

import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads JSON into plain Java objects: Map (object), List (array), String, Double, Boolean and null.
 * Uses only the streaming API of Gson, which is the same from Gson 2.2.4 (Minecraft 1.8.9) to 2.14.0.
 */
final class JsonTree {
    /** Deeper nesting is rejected, so a damaged file cannot overflow the stack. */
    static final int MAX_DEPTH = 64;

    private JsonTree() {
    }

    static Object parse(String json) throws JsonFormatException {
        JsonReader reader = new JsonReader(new StringReader(json));
        try {
            Object value = read(reader, 1);
            if (reader.peek() != JsonToken.END_DOCUMENT) {
                throw new JsonFormatException("Unexpected content after the end of the JSON value");
            }
            return value;
        } catch (IOException | IllegalStateException | NumberFormatException e) {
            // Gson reports syntax errors with these exceptions; the text comes from a string, so there is no I/O
            throw new JsonFormatException(String.valueOf(e.getMessage()));
        }
    }

    private static Object read(JsonReader reader, int depth) throws IOException, JsonFormatException {
        if (depth > MAX_DEPTH) {
            throw new JsonFormatException("JSON is nested more than " + MAX_DEPTH + " levels deep");
        }
        JsonToken token = reader.peek();
        switch (token) {
            case BEGIN_OBJECT: {
                Map<String, Object> object = new LinkedHashMap<>();
                reader.beginObject();
                while (reader.hasNext()) {
                    String name = reader.nextName();
                    object.put(name, read(reader, depth + 1));
                }
                reader.endObject();
                return object;
            }
            case BEGIN_ARRAY: {
                List<Object> array = new ArrayList<>();
                reader.beginArray();
                while (reader.hasNext()) {
                    array.add(read(reader, depth + 1));
                }
                reader.endArray();
                return array;
            }
            case STRING:
                return reader.nextString();
            case NUMBER:
                // Read as text, so that a number too large for a double does not break the whole file
                return Double.parseDouble(reader.nextString());
            case BOOLEAN:
                return reader.nextBoolean();
            case NULL:
                reader.nextNull();
                return null;
            default:
                throw new JsonFormatException("Unexpected " + token);
        }
    }
}
