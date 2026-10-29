package io.github.ecvrakamanescript.azyron.core.module.setting;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * A number between a minimum and a maximum in fixed steps, shown as a slider.
 * Values outside the range are clamped, and every value is rounded to the nearest step.
 */
public final class NumberSetting extends Setting<Double> {
    /** Tolerance when counting the steps that fit into the range. */
    private static final double EPSILON = 1e-9;

    private final double min;
    private final double max;
    private final double step;

    public NumberSetting(String id, double defaultValue, double min, double max, double step) {
        super(id, checkedDefault(defaultValue, min, max, step));
        this.min = min;
        this.max = max;
        this.step = step;
    }

    public double min() {
        return min;
    }

    public double max() {
        return max;
    }

    public double step() {
        return step;
    }

    /** The value rounded to a whole number. */
    public int getInt() {
        return (int) Math.round(get());
    }

    @Override
    protected Double normalize(Double value) {
        return normalize(value, min, max, step);
    }

    private static double checkedDefault(double defaultValue, double min, double max, double step) {
        if (!Double.isFinite(min) || !Double.isFinite(max) || min > max) {
            throw new IllegalArgumentException("Invalid range: " + min + " to " + max);
        }
        if (!Double.isFinite(step) || step <= 0) {
            throw new IllegalArgumentException("Invalid step: " + step);
        }
        if (Double.isNaN(defaultValue) || normalize(defaultValue, min, max, step) != defaultValue) {
            throw new IllegalArgumentException("Default value " + defaultValue + " is outside the range or not on a step");
        }
        return defaultValue;
    }

    private static double normalize(double value, double min, double max, double step) {
        if (Double.isNaN(value)) {
            throw new IllegalArgumentException("Value is not a number");
        }
        double clamped = Math.max(min, Math.min(max, value));
        // The last step must not go past the maximum if the range is not a multiple of the step
        long lastStep = (long) Math.floor((max - min) / step + EPSILON);
        long steps = Math.min(Math.round((clamped - min) / step), lastStep);
        double rounded = min + steps * step;
        // Removes floating-point noise, for example 0.30000000000000004 with step 0.1
        int scale = Math.max(scale(min), scale(step));
        return BigDecimal.valueOf(rounded).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }

    /** Number of decimal places of a value, for example 2 for 0.25. */
    private static int scale(double value) {
        return Math.max(0, BigDecimal.valueOf(value).stripTrailingZeros().scale());
    }
}
