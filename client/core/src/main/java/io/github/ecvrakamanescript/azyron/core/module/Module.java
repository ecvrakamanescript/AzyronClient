package io.github.ecvrakamanescript.azyron.core.module;

import io.github.ecvrakamanescript.azyron.core.module.setting.Setting;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * A feature of the client that can be turned on and off, for example an HUD element.
 * Subclasses add their settings in the constructor with {@link #addSetting}.
 * <p>
 * Import this class by its full name (not with a wildcard import): since Java 9,
 * java.lang.Module has the same simple name.
 */
public abstract class Module {
    /** Same as the mod id in fabric.mod.json. */
    private static final String TRANSLATION_PREFIX = "azyronclient.module.";

    private final String id;
    private final ModuleCategory category;
    private final boolean enabledByDefault;
    private final List<Setting<?>> settings = new ArrayList<>();
    private final Map<String, Setting<?>> settingsById = new HashMap<>();
    private boolean enabled;
    /** Set by the manager when the module is registered. */
    ModuleManager manager;

    protected Module(String id, ModuleCategory category, boolean enabledByDefault) {
        this.id = Ids.requireValid(id, "module");
        this.category = Objects.requireNonNull(category, "category");
        this.enabledByDefault = enabledByDefault;
        this.enabled = enabledByDefault;
    }

    /** Adds a setting and returns it. Setting ids must be unique within the module. */
    protected final <S extends Setting<?>> S addSetting(S setting) {
        Objects.requireNonNull(setting, "setting");
        if (settingsById.containsKey(setting.id())) {
            throw new IllegalArgumentException("Duplicate setting id \"" + setting.id() + "\" in module \"" + id + "\"");
        }
        settings.add(setting);
        settingsById.put(setting.id(), setting);
        return setting;
    }

    public final String id() {
        return id;
    }

    public final ModuleCategory category() {
        return category;
    }

    public final boolean isEnabledByDefault() {
        return enabledByDefault;
    }

    public final boolean isEnabled() {
        return enabled;
    }

    /** Translation key of the module name, for example "azyronclient.module.fps". */
    public final String translationKey() {
        return TRANSLATION_PREFIX + id;
    }

    /** All settings in the order they were added. */
    public final List<Setting<?>> settings() {
        return Collections.unmodifiableList(settings);
    }

    public final Optional<Setting<?>> setting(String id) {
        return Optional.ofNullable(settingsById.get(id));
    }

    /**
     * Turns the module on or off. Once the manager has started, {@link #onEnable} or {@link #onDisable}
     * runs after the state has changed.
     */
    public final void setEnabled(boolean enabled) {
        if (this.enabled == enabled) {
            return;
        }
        this.enabled = enabled;
        if (manager != null) {
            manager.enabledChanged(this);
        }
    }

    public final void toggle() {
        setEnabled(!enabled);
    }

    /** Restores the default state and the default values of all settings. */
    public final void reset() {
        setEnabled(enabledByDefault);
        for (Setting<?> setting : settings) {
            setting.reset();
        }
    }

    /** Called when the module is turned on, and by {@link ModuleManager#start} if it is already on. */
    protected void onEnable() {
    }

    /** Called when the module is turned off. */
    protected void onDisable() {
    }
}
