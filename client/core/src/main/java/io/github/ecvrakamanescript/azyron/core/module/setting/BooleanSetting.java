package io.github.ecvrakamanescript.azyron.core.module.setting;

/** A switch that is on or off. */
public final class BooleanSetting extends Setting<Boolean> {
    public BooleanSetting(String id, boolean defaultValue) {
        super(id, defaultValue);
    }

    public void toggle() {
        set(!get());
    }

    @Override
    protected Boolean normalize(Boolean value) {
        return value;
    }
}
