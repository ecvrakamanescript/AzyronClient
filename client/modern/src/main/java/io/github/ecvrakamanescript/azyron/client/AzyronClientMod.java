package io.github.ecvrakamanescript.azyron.client;

import io.github.ecvrakamanescript.azyron.core.AzyronCore;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.loader.api.FabricLoader;
import net.fabricmc.loader.api.ModContainer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Started by Fabric Loader when the game client starts. */
public final class AzyronClientMod implements ClientModInitializer {
    public static final String MOD_ID = "azyronclient";
    private static final Logger LOGGER = LoggerFactory.getLogger(AzyronCore.NAME);

    @Override
    public void onInitializeClient() {
        FabricLoader loader = FabricLoader.getInstance();
        String clientVersion = version(loader, MOD_ID);
        String minecraftVersion = version(loader, "minecraft");
        LOGGER.info(AzyronCore.startMessage(clientVersion, minecraftVersion));
    }

    private static String version(FabricLoader loader, String modId) {
        return loader.getModContainer(modId)
                .map(ModContainer::getMetadata)
                .map(metadata -> metadata.getVersion().getFriendlyString())
                .orElse("unknown");
    }
}
