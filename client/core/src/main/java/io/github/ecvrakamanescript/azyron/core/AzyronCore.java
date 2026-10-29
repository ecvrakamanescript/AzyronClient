package io.github.ecvrakamanescript.azyron.core;

/**
 * Entry point of the version-independent core.
 * Must not reference Minecraft classes and must stay compatible with Java 8.
 */
public final class AzyronCore {
    public static final String NAME = "Azyron Client";

    private AzyronCore() {
    }

    /** Text for the log line written when the client starts. */
    public static String startMessage(String clientVersion, String minecraftVersion) {
        return NAME + " " + clientVersion + " loaded (Minecraft " + minecraftVersion + ")";
    }
}
