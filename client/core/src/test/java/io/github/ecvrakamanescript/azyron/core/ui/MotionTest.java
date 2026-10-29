package io.github.ecvrakamanescript.azyron.core.ui;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MotionTest {
    @Test
    void easeOutStartsAndEndsExactly() {
        assertEquals(0, Easing.EASE_OUT.apply(0));
        assertEquals(1, Easing.EASE_OUT.apply(1));
        assertEquals(0, Easing.EASE_OUT.apply(-1));
        assertEquals(1, Easing.EASE_OUT.apply(2));
    }

    @Test
    void easeOutIsFastAtFirstAndNeverGoesBack() {
        double previous = 0;
        for (int i = 1; i <= 1000; i++) {
            double value = Easing.EASE_OUT.apply(i / 1000.0);
            assertTrue(value >= previous - 1e-9, "Not monotonic at " + i);
            previous = value;
        }
        // Decelerating: already most of the way at half the time
        assertTrue(Easing.EASE_OUT.apply(0.5) > 0.85);
    }

    @Test
    void linearBezierIsLinear() {
        Easing linear = Easing.cubicBezier(0.25, 0.25, 0.75, 0.75);
        for (int i = 0; i <= 10; i++) {
            assertEquals(i / 10.0, linear.apply(i / 10.0), 1e-6);
        }
    }

    @Test
    void controlPointsOutsideTheRangeAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> Easing.cubicBezier(-0.1, 0, 1, 1));
        assertThrows(IllegalArgumentException.class, () -> Easing.cubicBezier(0, 0, 1.1, 1));
    }

    @Test
    void animatedMovesToTheTargetInTheGivenTime() {
        Animated value = new Animated(0, Easing.LINEAR);

        value.animateTo(10, 200, 1000);

        assertEquals(0, value.value(1000));
        assertEquals(5, value.value(1100), 1e-4);
        assertEquals(10, value.value(1200));
        assertEquals(10, value.value(5000));
        assertTrue(value.isRunning(1199));
        assertFalse(value.isRunning(1200));
    }

    @Test
    void newTargetStartsFromTheCurrentValue() {
        Animated value = new Animated(0, Easing.LINEAR);
        value.animateTo(10, 200, 0);

        value.animateTo(0, 100, 100);

        assertEquals(5, value.value(100), 1e-4);
        assertEquals(2.5f, value.value(150), 1e-4);
        assertEquals(0, value.value(200));
    }

    @Test
    void sameTargetKeepsTheRunningAnimation() {
        Animated value = new Animated(0, Easing.LINEAR);
        value.animateTo(10, 200, 0);

        value.animateTo(10, 200, 100);

        assertEquals(10, value.value(200));
    }

    @Test
    void setJumpsWithoutAnimation() {
        Animated value = new Animated(0);
        value.animateTo(1, Animated.MEDIUM, 0);

        value.set(0.25f);

        assertEquals(0.25f, value.value(10));
        assertFalse(value.isRunning(10));
    }
}
