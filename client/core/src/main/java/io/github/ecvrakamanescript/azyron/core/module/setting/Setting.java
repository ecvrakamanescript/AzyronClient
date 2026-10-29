package io.github.ecvrakamanescript.azyron.core.module.setting;

import io.github.ecvrakamanescript.azyron.core.module.Ids;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * A value of a module that the player can change in the client menu.
 * Setting ids must be unique within a module.
 */
public abstract class Setting<T> {
    /** Called after the value has changed. */
    public interface Listener<T> {
        void changed(T oldValue, T newValue);
    }

    private final String id;
    private final T defaultValue;
    private final List<Listener<? super T>> listeners = new ArrayList<>();
    private T value;

    /** Subclasses check the default value before they call this constructor. */
    protected Setting(String id, T defaultValue) {
        this.id = Ids.requireValid(id, "setting");
        this.defaultValue = Objects.requireNonNull(defaultValue, "defaultValue");
        this.value = defaultValue;
    }

    public final String id() {
        return id;
    }

    public final T defaultValue() {
        return defaultValue;
    }

    public final T get() {
        return value;
    }

    /**
     * Sets a new value. Throws an IllegalArgumentException if the value is not allowed;
     * some settings adjust the value instead, for example by clamping a number to its range.
     */
    public final void set(T newValue) {
        Objects.requireNonNull(newValue, "value");
        T normalized = normalize(newValue);
        if (normalized.equals(value)) {
            return;
        }
        T oldValue = value;
        value = normalized;
        // Copy, so that a listener can remove itself
        for (Listener<? super T> listener : new ArrayList<>(listeners)) {
            listener.changed(oldValue, normalized);
        }
    }

    public final void reset() {
        set(defaultValue);
    }

    public final boolean isDefault() {
        return value.equals(defaultValue);
    }

    public final void addListener(Listener<? super T> listener) {
        listeners.add(Objects.requireNonNull(listener, "listener"));
    }

    public final void removeListener(Listener<? super T> listener) {
        listeners.remove(listener);
    }

    /** Returns the value to store, or throws an IllegalArgumentException if the value is not allowed. */
    protected abstract T normalize(T value);
}
