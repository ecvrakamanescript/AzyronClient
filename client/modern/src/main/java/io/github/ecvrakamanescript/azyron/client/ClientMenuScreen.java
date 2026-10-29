package io.github.ecvrakamanescript.azyron.client;

import io.github.ecvrakamanescript.azyron.core.AzyronCore;
import io.github.ecvrakamanescript.azyron.core.module.Module;
import io.github.ecvrakamanescript.azyron.core.module.ModuleCategory;
import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;
import net.minecraft.ChatFormatting;
import net.minecraft.client.gui.components.Button;
import net.minecraft.client.gui.components.StringWidget;
import net.minecraft.client.gui.layouts.HeaderAndFooterLayout;
import net.minecraft.client.gui.layouts.LinearLayout;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.CommonComponents;
import net.minecraft.network.chat.Component;

import java.util.List;

/**
 * Client menu with every module grouped by category and an on/off button for each. Built only from
 * Minecraft widgets and layouts, so the same code works in every supported version.
 */
final class ClientMenuScreen extends Screen {
    private static final int BUTTON_WIDTH = 200;

    private final HeaderAndFooterLayout layout = new HeaderAndFooterLayout(this);
    private final ModuleManager modules = AzyronClientMod.modules();
    private boolean changed;

    ClientMenuScreen() {
        super(Component.literal(AzyronCore.NAME));
    }

    @Override
    protected void init() {
        layout.addTitleHeader(title, font);

        LinearLayout contents = layout.addToContents(LinearLayout.vertical().spacing(4));
        contents.defaultCellSetting().alignHorizontallyCenter();
        contents.addChild(new StringWidget(
                Component.translatable("azyronclient.menu.version", AzyronClientMod.version()).withStyle(ChatFormatting.GRAY),
                font));

        if (modules.all().isEmpty()) {
            contents.addChild(new StringWidget(Component.translatable("azyronclient.menu.no_modules"), font));
        }
        for (ModuleCategory category : ModuleCategory.values()) {
            List<Module> inCategory = modules.byCategory(category);
            if (inCategory.isEmpty()) {
                continue;
            }
            contents.addChild(new StringWidget(
                    Component.translatable("azyronclient.category." + category.id()).withStyle(ChatFormatting.BOLD),
                    font));
            for (Module module : inCategory) {
                contents.addChild(Button.builder(label(module), button -> {
                    module.toggle();
                    changed = true;
                    button.setMessage(label(module));
                }).width(BUTTON_WIDTH).build());
            }
        }

        layout.addToFooter(Button.builder(CommonComponents.GUI_DONE, button -> onClose()).width(BUTTON_WIDTH).build());
        layout.visitWidgets(this::addRenderableWidget);
        repositionElements();
    }

    @Override
    protected void repositionElements() {
        layout.arrangeElements();
    }

    @Override
    public void onClose() {
        if (changed) {
            AzyronClientMod.saveConfig();
            changed = false;
        }
        super.onClose();
    }

    @Override
    public boolean isPauseScreen() {
        // The game keeps running while the menu is open
        return false;
    }

    private static Component label(Module module) {
        return CommonComponents.optionStatus(Component.translatable(module.translationKey()), module.isEnabled());
    }
}
