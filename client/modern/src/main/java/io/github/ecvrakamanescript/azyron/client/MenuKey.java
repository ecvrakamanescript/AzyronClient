package io.github.ecvrakamanescript.azyron.client;

import com.mojang.blaze3d.platform.InputConstants;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.KeyMapping;
import net.minecraft.client.Minecraft;
import net.minecraft.resources.Identifier;

//? if >=26.1 {
import net.fabricmc.fabric.api.client.keymapping.v1.KeyMappingHelper;
//?} else {
/*import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
*///?}

/**
 * Key that opens the client menu. It is listed under Options, Controls, Key Binds, where it can be
 * changed; Minecraft saves the binding in options.txt.
 */
final class MenuKey {
    private static final KeyMapping.Category CATEGORY =
            KeyMapping.Category.register(Identifier.fromNamespaceAndPath(AzyronClientMod.MOD_ID, "main"));

    private static KeyMapping key;

    private MenuKey() {
    }

    static void register() {
        // InputConstants instead of GLFW: since 26.1 Minecraft uses SDL key codes
        key = new KeyMapping("key.azyronclient.open_menu", InputConstants.KEY_RSHIFT, CATEGORY);
        //? if >=26.1 {
        KeyMappingHelper.registerKeyMapping(key);
        //?} else {
        /*KeyBindingHelper.registerKeyBinding(key);
        *///?}
        ClientTickEvents.END_CLIENT_TICK.register(MenuKey::tick);
    }

    private static void tick(Minecraft minecraft) {
        while (key.consumeClick()) {
            // Only from the game itself, never on top of another screen such as the chat
            //? if >=26.1 {
            if (minecraft.gui.screen() == null) {
                minecraft.gui.setScreen(new ClientMenuScreen());
            }
            //?} else {
            /*if (minecraft.screen == null) {
                minecraft.setScreen(new ClientMenuScreen());
            }
            *///?}
        }
    }
}
