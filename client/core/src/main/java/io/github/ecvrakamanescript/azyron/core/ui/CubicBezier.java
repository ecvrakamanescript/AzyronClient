package io.github.ecvrakamanescript.azyron.core.ui;

/**
 * Cubic Bézier easing with the start point (0, 0) and the end point (1, 1), as in CSS.
 * The x value for a given progress is found with Newton's method and, if that does not converge,
 * by bisection.
 */
final class CubicBezier implements Easing {
    private static final double EPSILON = 1e-7;

    private final double x1;
    private final double y1;
    private final double x2;
    private final double y2;

    CubicBezier(double x1, double y1, double x2, double y2) {
        if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
            throw new IllegalArgumentException("x1 and x2 must be between 0 and 1");
        }
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    @Override
    public double apply(double progress) {
        if (progress <= 0) {
            return 0;
        }
        if (progress >= 1) {
            return 1;
        }
        return curve(y1, y2, solveT(progress));
    }

    private double solveT(double x) {
        double t = x;
        for (int i = 0; i < 8; i++) {
            double error = curve(x1, x2, t) - x;
            if (Math.abs(error) < EPSILON) {
                return t;
            }
            double slope = slope(x1, x2, t);
            if (Math.abs(slope) < 1e-6) {
                break;
            }
            t -= error / slope;
        }
        double low = 0;
        double high = 1;
        t = x;
        while (high - low > EPSILON) {
            double value = curve(x1, x2, t);
            if (value < x) {
                low = t;
            } else {
                high = t;
            }
            t = (low + high) / 2;
        }
        return t;
    }

    /** One coordinate of the curve at t, with the control values a and b. */
    private static double curve(double a, double b, double t) {
        double u = 1 - t;
        return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
    }

    private static double slope(double a, double b, double t) {
        double u = 1 - t;
        return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
    }
}
