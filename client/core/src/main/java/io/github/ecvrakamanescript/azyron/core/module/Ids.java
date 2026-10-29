package io.github.ecvrakamanescript.azyron.core.module;

import java.util.regex.Pattern;

/** Rules for module and setting ids. Ids are stored in the configuration and used in translation keys. */
public final class Ids {
    /** A lowercase letter, then lowercase letters, digits or underscores; at most 32 characters. */
    private static final Pattern VALID = Pattern.compile("[a-z][a-z0-9_]{0,31}");

    private Ids() {
    }

    public static boolean isValid(String id) {
        return id != null && VALID.matcher(id).matches();
    }

    /** Returns the id, or throws an exception if it does not follow the rules. */
    public static String requireValid(String id, String kind) {
        if (!isValid(id)) {
            throw new IllegalArgumentException("Invalid " + kind + " id: " + (id == null ? "null" : "\"" + id + "\""));
        }
        return id;
    }
}
