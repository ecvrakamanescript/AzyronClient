package io.github.ecvrakamanescript.azyron.core.module.setting;

import java.util.regex.Pattern;

/**
 * A keyboard key or mouse button, stored by its Minecraft key name such as "key.keyboard.c" or
 * "key.mouse.4", as in Minecraft's options.txt. The names are the same in every version, while the
 * key codes are not (GLFW up to 1.21.11, SDL since 26.1, LWJGL 2 in 1.8.9).
 * <p>
 * Only the form of the name is checked here. Whether the running Minecraft version knows the key
 * is checked by the version adapter.
 */
public final class KeySetting extends Setting<String> {
    /** No key assigned. */
    public static final String NONE = "key.keyboard.unknown";
    /** Longest accepted key name. */
    public static final int MAX_LENGTH = 64;

    private static final Pattern NAME = Pattern.compile("key\\.(keyboard|mouse)(\\.[a-z0-9]+)+");

    public KeySetting(String id, String defaultKey) {
        super(id, checked(defaultKey));
    }

    public boolean isBound() {
        return !get().equals(NONE);
    }

    /** Removes the key. */
    public void clear() {
        set(NONE);
    }

    /** Whether the text has the form of a Minecraft key name. */
    public static boolean isValidName(String name) {
        return name != null && name.length() <= MAX_LENGTH && NAME.matcher(name).matches();
    }

    @Override
    protected String normalize(String key) {
        return checked(key);
    }

    private static String checked(String key) {
        if (!isValidName(key)) {
            throw new IllegalArgumentException("Invalid key name: \"" + key + "\"");
        }
        return key;
    }
}
