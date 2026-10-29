package io.github.ecvrakamanescript.azyron.core.module;

import io.github.ecvrakamanescript.azyron.core.module.setting.BooleanSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.NumberSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.Setting;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleTest {
    @Test
    void startsInItsDefaultState() {
        TestModule on = new TestModule("fps", ModuleCategory.HUD, true);
        TestModule off = new TestModule("zoom", ModuleCategory.PVP, false);

        assertTrue(on.isEnabled());
        assertTrue(on.isEnabledByDefault());
        assertFalse(off.isEnabled());
        assertFalse(off.isEnabledByDefault());
        assertEquals("fps", on.id());
        assertEquals(ModuleCategory.PVP, off.category());
    }

    @Test
    void rejectsInvalidIdAndMissingCategory() {
        assertThrows(IllegalArgumentException.class, () -> new TestModule("Fps"));
        assertThrows(IllegalArgumentException.class, () -> new TestModule(null));
        assertThrows(NullPointerException.class, () -> new TestModule("fps", null, false));
    }

    @Test
    void buildsTheTranslationKeyFromTheId() {
        assertEquals("azyronclient.module.key_strokes", new TestModule("key_strokes").translationKey());
    }

    @Test
    void keepsSettingsInOrderAndFindsThemById() {
        TestModule module = new TestModule("fps");
        BooleanSetting shadow = module.add(new BooleanSetting("shadow", true));
        NumberSetting scale = module.add(new NumberSetting("scale", 1, 0.5, 2, 0.1));

        assertEquals(List.of(shadow, scale), module.settings());
        assertSame(scale, module.setting("scale").orElseThrow());
        assertTrue(module.setting("missing").isEmpty());
    }

    @Test
    void rejectsDuplicateSettingIds() {
        TestModule module = new TestModule("fps");
        module.add(new BooleanSetting("shadow", true));

        assertThrows(IllegalArgumentException.class, () -> module.add(new BooleanSetting("shadow", false)));
        assertThrows(NullPointerException.class, () -> module.add(null));
        assertEquals(1, module.settings().size());
    }

    @Test
    void settingsListCannotBeChanged() {
        TestModule module = new TestModule("fps");
        List<Setting<?>> settings = module.settings();

        assertThrows(UnsupportedOperationException.class, () -> settings.add(new BooleanSetting("shadow", true)));
    }

    @Test
    void togglesWithoutRunningHooksWhenNotRegistered() {
        TestModule module = new TestModule("fps");

        module.toggle();
        assertTrue(module.isEnabled());
        module.setEnabled(false);
        assertFalse(module.isEnabled());
        assertTrue(module.calls.isEmpty());
    }

    @Test
    void resetRestoresStateAndSettings() {
        TestModule module = new TestModule("fps", ModuleCategory.HUD, true);
        BooleanSetting shadow = module.add(new BooleanSetting("shadow", true));
        NumberSetting scale = module.add(new NumberSetting("scale", 1, 0.5, 2, 0.1));
        module.setEnabled(false);
        shadow.set(false);
        scale.set(1.5);

        module.reset();

        assertTrue(module.isEnabled());
        assertTrue(shadow.get());
        assertEquals(1.0, scale.get());
    }
}
