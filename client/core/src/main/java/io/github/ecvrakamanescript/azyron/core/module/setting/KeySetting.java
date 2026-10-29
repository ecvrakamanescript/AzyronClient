package io.github.ecvrakamanescript.azyron.core.module.setting;

/**
 * A keyboard key, stored as a GLFW key code so that it does not depend on the Minecraft version.
 * The 1.8.9 client converts its LWJGL 2 key codes to GLFW key codes.
 */
public final class KeySetting extends Setting<Integer> {
    /** No key assigned (GLFW_KEY_UNKNOWN). */
    public static final int NONE = -1;
    /** Lowest GLFW key code (GLFW_KEY_SPACE). */
    public static final int FIRST_KEY = 32;
    /** Highest GLFW key code (GLFW_KEY_LAST). */
    public static final int LAST_KEY = 348;

    public KeySetting(String id, int defaultKey) {
        super(id, checked(defaultKey));
    }

    public boolean isBound() {
        return get() != NONE;
    }

    /** Removes the key. */
    public void clear() {
        set(NONE);
    }

    @Override
    protected Integer normalize(Integer key) {
        return checked(key);
    }

    private static int checked(int key) {
        if (key != NONE && (key < FIRST_KEY || key > LAST_KEY)) {
            throw new IllegalArgumentException("Invalid key code: " + key);
        }
        return key;
    }
}
