package io.github.ecvrakamanescript.azyron.core.module.setting;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NumberSettingTest {
    @Test
    void keepsRangeAndStep() {
        NumberSetting setting = new NumberSetting("scale", 1, 0.5, 2, 0.1);

        assertEquals(1.0, setting.get());
        assertEquals(0.5, setting.min());
        assertEquals(2.0, setting.max());
        assertEquals(0.1, setting.step());
    }

    @Test
    void clampsToTheRange() {
        NumberSetting setting = new NumberSetting("scale", 1, 0.5, 2, 0.1);

        setting.set(5.0);
        assertEquals(2.0, setting.get());
        setting.set(-3.0);
        assertEquals(0.5, setting.get());
        setting.set(Double.POSITIVE_INFINITY);
        assertEquals(2.0, setting.get());
        setting.set(Double.NEGATIVE_INFINITY);
        assertEquals(0.5, setting.get());
    }

    @Test
    void roundsToTheNearestStep() {
        NumberSetting setting = new NumberSetting("opacity", 50, 0, 100, 5);

        setting.set(52.0);
        assertEquals(50.0, setting.get());
        setting.set(53.0);
        assertEquals(55.0, setting.get());
        setting.set(97.6);
        assertEquals(100.0, setting.get());
    }

    @Test
    void removesFloatingPointNoise() {
        NumberSetting setting = new NumberSetting("scale", 0, 0, 1, 0.1);

        setting.set(0.1 + 0.2);
        assertEquals(0.3, setting.get());
        setting.set(0.7);
        assertEquals(0.7, setting.get());
        setting.set(0.04);
        assertEquals(0.0, setting.get());
    }

    @Test
    void lastStepStaysInsideTheRange() {
        // 0, 0.4 and 0.8 are steps; 1.2 would be past the maximum
        NumberSetting setting = new NumberSetting("scale", 0, 0, 1, 0.4);

        setting.set(1.0);
        assertEquals(0.8, setting.get());
    }

    @Test
    void worksWithNegativeRanges() {
        NumberSetting setting = new NumberSetting("offset", 0, -10, 10, 2);

        setting.set(-7.1);
        assertEquals(-8.0, setting.get());
        setting.set(-0.0);
        assertEquals(0.0, setting.get());
    }

    @Test
    void stepsCanStartAtTheMinimum() {
        NumberSetting setting = new NumberSetting("fov", 30, 30, 110, 1);

        setting.set(70.4);
        assertEquals(70.0, setting.get());
        assertEquals(70, setting.getInt());
    }

    @Test
    void rejectsNaN() {
        NumberSetting setting = new NumberSetting("scale", 1, 0.5, 2, 0.1);

        assertThrows(IllegalArgumentException.class, () -> setting.set(Double.NaN));
        assertEquals(1.0, setting.get());
    }

    @Test
    void rejectsInvalidRangeAndStep() {
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, 2, 0.5, 0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, Double.NaN, 2, 0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, 0, Double.POSITIVE_INFINITY, 0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, 0, 2, 0));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, 0, 2, -0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 1, 0, 2, Double.NaN));
    }

    @Test
    void rejectsDefaultOutsideTheRangeOrNotOnAStep() {
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 3, 0, 2, 0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", 0.25, 0, 2, 0.1));
        assertThrows(IllegalArgumentException.class, () -> new NumberSetting("scale", Double.NaN, 0, 2, 0.1));
    }

    @Test
    void doesNotNotifyWhenRoundingGivesTheSameValue() {
        NumberSetting setting = new NumberSetting("opacity", 50, 0, 100, 5);
        List<Double> events = new ArrayList<>();
        setting.addListener((oldValue, newValue) -> events.add(newValue));

        setting.set(51.0);

        assertTrue(events.isEmpty());
    }
}
