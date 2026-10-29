package io.github.ecvrakamanescript.azyron.core.module;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ModuleManagerTest {
    @Test
    void registersModulesInOrder() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));
        TestModule zoom = manager.register(new TestModule("zoom", ModuleCategory.PVP, false));

        assertEquals(List.of(fps, zoom), manager.all());
        assertSame(zoom, manager.get("zoom").orElseThrow());
        assertTrue(manager.get("missing").isEmpty());
    }

    @Test
    void rejectsDuplicateIds() {
        ModuleManager manager = new ModuleManager();
        manager.register(new TestModule("fps"));

        assertThrows(IllegalArgumentException.class, () -> manager.register(new TestModule("fps")));
        assertThrows(NullPointerException.class, () -> manager.register(null));
        assertEquals(1, manager.all().size());
    }

    @Test
    void rejectsAModuleThatIsAlreadyRegistered() {
        ModuleManager first = new ModuleManager();
        ModuleManager second = new ModuleManager();
        TestModule fps = first.register(new TestModule("fps"));

        assertThrows(IllegalArgumentException.class, () -> first.register(fps));
        assertThrows(IllegalArgumentException.class, () -> second.register(fps));
        assertTrue(second.all().isEmpty());
    }

    @Test
    void rejectsRegistrationAfterStartAndASecondStart() {
        ModuleManager manager = new ModuleManager();
        manager.start();

        assertTrue(manager.isStarted());
        assertThrows(IllegalStateException.class, () -> manager.register(new TestModule("fps")));
        assertThrows(IllegalStateException.class, manager::start);
    }

    @Test
    void startEnablesOnlyModulesThatAreOn() {
        ModuleManager manager = new ModuleManager();
        TestModule on = manager.register(new TestModule("fps", ModuleCategory.HUD, true));
        TestModule off = manager.register(new TestModule("zoom", ModuleCategory.PVP, false));

        assertTrue(on.calls.isEmpty());
        manager.start();

        assertEquals(List.of("enable"), on.calls);
        assertTrue(off.calls.isEmpty());
    }

    @Test
    void hooksRunOnlyAfterStart() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));

        // Before the start, for example while the configuration is loaded
        fps.setEnabled(true);
        fps.setEnabled(false);
        assertTrue(fps.calls.isEmpty());

        manager.start();
        fps.setEnabled(true);
        fps.toggle();
        assertEquals(List.of("enable", "disable"), fps.calls);
    }

    @Test
    void sameStateDoesNothing() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps", ModuleCategory.HUD, true));
        List<String> events = new ArrayList<>();
        manager.addListener((module, enabled) -> events.add(module.id() + "=" + enabled));
        manager.start();
        fps.calls.clear();

        fps.setEnabled(true);

        assertTrue(fps.calls.isEmpty());
        assertTrue(events.isEmpty());
    }

    @Test
    void notifiesListenersBeforeAndAfterStart() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));
        List<String> events = new ArrayList<>();
        manager.addListener((module, enabled) -> events.add(module.id() + "=" + enabled));

        fps.setEnabled(true);
        manager.start();
        fps.setEnabled(false);

        assertEquals(List.of("fps=true", "fps=false"), events);
    }

    @Test
    void listenerRunsAfterTheHook() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));
        manager.addListener((module, enabled) -> fps.calls.add("listener"));
        manager.start();

        fps.setEnabled(true);

        assertEquals(List.of("enable", "listener"), fps.calls);
    }

    @Test
    void removedListenerIsNotCalled() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));
        List<String> events = new ArrayList<>();
        ModuleManager.Listener listener = (module, enabled) -> events.add(module.id());
        manager.addListener(listener);
        manager.removeListener(listener);

        fps.toggle();

        assertTrue(events.isEmpty());
    }

    @Test
    void listenerCanRemoveItselfWhileCalled() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps"));
        List<String> events = new ArrayList<>();
        manager.addListener(new ModuleManager.Listener() {
            @Override
            public void enabledChanged(Module module, boolean enabled) {
                events.add("once");
                manager.removeListener(this);
            }
        });
        manager.addListener((module, enabled) -> events.add("always"));

        fps.toggle();
        fps.toggle();

        assertEquals(List.of("once", "always", "always"), events);
    }

    @Test
    void filtersByCategoryAndState() {
        ModuleManager manager = new ModuleManager();
        TestModule fps = manager.register(new TestModule("fps", ModuleCategory.HUD, true));
        TestModule coordinates = manager.register(new TestModule("coordinates", ModuleCategory.HUD, false));
        TestModule zoom = manager.register(new TestModule("zoom", ModuleCategory.PVP, true));

        assertEquals(List.of(fps, coordinates), manager.byCategory(ModuleCategory.HUD));
        assertEquals(List.of(zoom), manager.byCategory(ModuleCategory.PVP));
        assertTrue(manager.byCategory(ModuleCategory.PERFORMANCE).isEmpty());
        assertEquals(List.of(fps, zoom), manager.enabled());

        coordinates.setEnabled(true);
        zoom.setEnabled(false);
        assertEquals(List.of(fps, coordinates), manager.enabled());
    }

    @Test
    void returnedListsCannotBeChanged() {
        ModuleManager manager = new ModuleManager();
        manager.register(new TestModule("fps", ModuleCategory.HUD, true));

        assertThrows(UnsupportedOperationException.class, () -> manager.all().clear());
        assertThrows(UnsupportedOperationException.class, () -> manager.enabled().clear());
        assertThrows(UnsupportedOperationException.class, () -> manager.byCategory(ModuleCategory.HUD).clear());
        assertFalse(manager.all().isEmpty());
    }

    @Test
    void categoryIdsAreLowercase() {
        assertEquals("hud", ModuleCategory.HUD.id());
        assertEquals("pvp", ModuleCategory.PVP.id());
        assertEquals("performance", ModuleCategory.PERFORMANCE.id());
        assertEquals("utility", ModuleCategory.UTILITY.id());
    }
}
