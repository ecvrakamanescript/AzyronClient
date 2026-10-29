package io.github.ecvrakamanescript.azyron.client;

import io.github.ecvrakamanescript.azyron.core.AzyronCore;
import io.github.ecvrakamanescript.azyron.core.config.ConfigFile;
import io.github.ecvrakamanescript.azyron.core.config.LoadResult;
import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.loader.api.FabricLoader;
import net.fabricmc.loader.api.ModContainer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/** Started by Fabric Loader when the game client starts. */
public final class AzyronClientMod implements ClientModInitializer {
    public static final String MOD_ID = "azyronclient";
    private static final Logger LOGGER = LoggerFactory.getLogger(AzyronCore.NAME);

    private static final ModuleManager MODULES = new ModuleManager();
    private static ConfigFile config;
    private static boolean configCanBeSaved;
    private static String clientVersion = "unknown";

    /** All modules of the client. */
    public static ModuleManager modules() {
        return MODULES;
    }

    /** Version of the client, as in fabric.mod.json. */
    public static String version() {
        return clientVersion;
    }

    @Override
    public void onInitializeClient() {
        FabricLoader loader = FabricLoader.getInstance();
        clientVersion = version(loader, MOD_ID);
        String minecraftVersion = version(loader, "minecraft");
        LOGGER.info(AzyronCore.startMessage(clientVersion, minecraftVersion));

        // Modules are registered here before the configuration is loaded (from step 3.6 on)
        config = new ConfigFile(loader.getConfigDir());
        loadConfig();
        MODULES.start();

        MenuKey.register();
    }

    private static void loadConfig() {
        LoadResult result = config.load(MODULES);
        for (String warning : result.warnings()) {
            LOGGER.warn("Config: {}", warning);
        }
        switch (result.status()) {
            case MISSING -> LOGGER.info("No config file yet, using default values");
            case LOADED -> LOGGER.info("Loaded config from {}", config.path());
            case BROKEN -> LOGGER.warn("Config file was damaged, using default values");
            case UNREADABLE -> LOGGER.error("Could not read the config file; it will not be saved, so it is not overwritten");
        }
        configCanBeSaved = result.canSave();
        // Writes the file once, so that it exists and contains every module with valid values
        saveConfig();
    }

    /** Saves all modules, unless the file could not be read at startup (then it is kept as it is). */
    static void saveConfig() {
        if (!configCanBeSaved) {
            return;
        }
        try {
            config.save(MODULES);
        } catch (IOException e) {
            LOGGER.error("Could not save the config file {}", config.path(), e);
        }
    }

    private static String version(FabricLoader loader, String modId) {
        return loader.getModContainer(modId)
                .map(ModContainer::getMetadata)
                .map(metadata -> metadata.getVersion().getFriendlyString())
                .orElse("unknown");
    }
}
