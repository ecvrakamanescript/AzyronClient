package io.github.ecvrakamanescript.azyron.core.ui;

/**
 * A number that moves smoothly to a new target. Time is passed in as milliseconds, so the value
 * depends on real time and not on the frame rate.
 */
public final class Animated {
    /** Hover and press feedback, as --duration-fast in the launcher. */
    public static final int FAST = 140;
    /** Opening, closing and larger changes, as --duration-medium in the launcher. */
    public static final int MEDIUM = 240;

    private final Easing easing;
    private float from;
    private float to;
    private long startMillis;
    private int durationMillis;

    public Animated(float initial) {
        this(initial, Easing.EASE_OUT);
    }

    public Animated(float initial, Easing easing) {
        this.easing = easing;
        this.from = initial;
        this.to = initial;
    }

    /**
     * Starts moving from the current value to the target. Calling it again with the same target
     * keeps the running animation.
     */
    public void animateTo(float target, int durationMillis, long nowMillis) {
        if (target == to) {
            return;
        }
        from = value(nowMillis);
        to = target;
        startMillis = nowMillis;
        this.durationMillis = Math.max(0, durationMillis);
    }

    /** Jumps to the value without animation. */
    public void set(float value) {
        from = value;
        to = value;
        durationMillis = 0;
    }

    public float target() {
        return to;
    }

    public float value(long nowMillis) {
        if (durationMillis == 0 || nowMillis >= startMillis + durationMillis) {
            return to;
        }
        double progress = Math.max(0, nowMillis - startMillis) / (double) durationMillis;
        return (float) (from + (to - from) * easing.apply(progress));
    }

    public boolean isRunning(long nowMillis) {
        return durationMillis > 0 && nowMillis < startMillis + durationMillis;
    }
}
