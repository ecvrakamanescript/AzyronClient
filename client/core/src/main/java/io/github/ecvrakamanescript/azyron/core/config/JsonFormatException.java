package io.github.ecvrakamanescript.azyron.core.config;

/** The text is not valid JSON. */
final class JsonFormatException extends Exception {
    private static final long serialVersionUID = 1L;

    JsonFormatException(String message) {
        super(message);
    }
}
