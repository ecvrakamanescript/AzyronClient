package io.github.ecvrakamanescript.azyron.core.module;

import io.github.ecvrakamanescript.azyron.core.module.setting.Setting;

import java.util.ArrayList;
import java.util.List;

/** Module for the tests that records when its hooks run. */
final class TestModule extends Module {
    final List<String> calls = new ArrayList<>();

    TestModule(String id, ModuleCategory category, boolean enabledByDefault) {
        super(id, category, enabledByDefault);
    }

    TestModule(String id) {
        this(id, ModuleCategory.HUD, false);
    }

    <S extends Setting<?>> S add(S setting) {
        return addSetting(setting);
    }

    @Override
    protected void onEnable() {
        calls.add("enable");
    }

    @Override
    protected void onDisable() {
        calls.add("disable");
    }
}
