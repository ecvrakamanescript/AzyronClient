package io.github.ecvrakamanescript.azyron.core.ui;

/** Maps the progress of an animation (0 to 1) to the eased progress. */
public interface Easing {
    Easing LINEAR = t -> t;

    /** Short and decelerating, as --ease-out in the launcher: cubic-bezier(0.22, 1, 0.36, 1). */
    Easing EASE_OUT = cubicBezier(0.22, 1, 0.36, 1);

    double apply(double progress);

    /** Same curve as the CSS function cubic-bezier(x1, y1, x2, y2). */
    static Easing cubicBezier(double x1, double y1, double x2, double y2) {
        return new CubicBezier(x1, y1, x2, y2);
    }
}
