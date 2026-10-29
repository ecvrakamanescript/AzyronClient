package io.github.ecvrakamanescript.azyron.core.config;

import io.github.ecvrakamanescript.azyron.core.module.Module;
import io.github.ecvrakamanescript.azyron.core.module.ModuleCategory;
import io.github.ecvrakamanescript.azyron.core.module.setting.BooleanSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.ChoiceSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.ColorSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.KeySetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.NumberSetting;

/** Module for the tests with one setting of every type. */
final class ExampleModule extends Module {
    static final String DEFAULT_KEY = "key.keyboard.c";

    final BooleanSetting shadow = addSetting(new BooleanSetting("shadow", true));
    final NumberSetting scale = addSetting(new NumberSetting("scale", 1, 0.5, 2, 0.1));
    final ColorSetting color = addSetting(new ColorSetting("color", 0xFF7C3AED, false));
    final ColorSetting background = addSetting(new ColorSetting("background", 0x80000000, true));
    final KeySetting key = addSetting(new KeySetting("key", DEFAULT_KEY));
    final ChoiceSetting mode = addSetting(new ChoiceSetting("mode", "smooth", "smooth", "instant"));

    ExampleModule(String id, boolean enabledByDefault) {
        super(id, ModuleCategory.HUD, enabledByDefault);
    }

    boolean hasDefaultSettings() {
        return shadow.isDefault() && scale.isDefault() && color.isDefault()
                && background.isDefault() && key.isDefault() && mode.isDefault();
    }
}
