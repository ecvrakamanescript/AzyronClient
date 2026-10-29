package io.github.ecvrakamanescript.azyron.core.module;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Holds all modules of the client. All modules are registered first; {@link #start} then calls
 * {@link Module#onEnable} for every module that is on. Before the start, modules can be turned
 * on and off without running their hooks (for example while the configuration is loaded).
 * Not thread-safe: use it only on the render thread of the game.
 */
public final class ModuleManager {
    /** Called after a module was turned on or off. */
    public interface Listener {
        void enabledChanged(Module module, boolean enabled);
    }

    private final Map<String, Module> modules = new LinkedHashMap<>();
    private final List<Listener> listeners = new ArrayList<>();
    private boolean started;

    /** Registers a module and returns it. Module ids must be unique. */
    public <M extends Module> M register(M module) {
        Objects.requireNonNull(module, "module");
        if (started) {
            throw new IllegalStateException("Modules must be registered before start()");
        }
        if (module.manager != null) {
            throw new IllegalArgumentException("Module \"" + module.id() + "\" is already registered");
        }
        if (modules.containsKey(module.id())) {
            throw new IllegalArgumentException("Duplicate module id \"" + module.id() + "\"");
        }
        module.manager = this;
        modules.put(module.id(), module);
        return module;
    }

    /** Runs {@link Module#onEnable} for every module that is on. Can only be called once. */
    public void start() {
        if (started) {
            throw new IllegalStateException("The module manager has already started");
        }
        started = true;
        for (Module module : modules.values()) {
            if (module.isEnabled()) {
                module.onEnable();
            }
        }
    }

    public boolean isStarted() {
        return started;
    }

    public Optional<Module> get(String id) {
        return Optional.ofNullable(modules.get(id));
    }

    /** All modules in the order they were registered. */
    public List<Module> all() {
        return Collections.unmodifiableList(new ArrayList<>(modules.values()));
    }

    public List<Module> byCategory(ModuleCategory category) {
        Objects.requireNonNull(category, "category");
        List<Module> result = new ArrayList<>();
        for (Module module : modules.values()) {
            if (module.category() == category) {
                result.add(module);
            }
        }
        return Collections.unmodifiableList(result);
    }

    /** All modules that are on. */
    public List<Module> enabled() {
        List<Module> result = new ArrayList<>();
        for (Module module : modules.values()) {
            if (module.isEnabled()) {
                result.add(module);
            }
        }
        return Collections.unmodifiableList(result);
    }

    public void addListener(Listener listener) {
        listeners.add(Objects.requireNonNull(listener, "listener"));
    }

    public void removeListener(Listener listener) {
        listeners.remove(listener);
    }

    /** Called by {@link Module#setEnabled} after the state has changed. */
    void enabledChanged(Module module) {
        if (started) {
            if (module.isEnabled()) {
                module.onEnable();
            } else {
                module.onDisable();
            }
        }
        // Copy, so that a listener can remove itself
        for (Listener listener : new ArrayList<>(listeners)) {
            listener.enabledChanged(module, module.isEnabled());
        }
    }
}
