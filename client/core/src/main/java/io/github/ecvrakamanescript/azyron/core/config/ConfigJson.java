package io.github.ecvrakamanescript.azyron.core.config;

import com.google.gson.stream.JsonWriter;
import io.github.ecvrakamanescript.azyron.core.module.Module;
import io.github.ecvrakamanescript.azyron.core.module.ModuleManager;
import io.github.ecvrakamanescript.azyron.core.module.setting.BooleanSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.ChoiceSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.ColorSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.KeySetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.NumberSetting;
import io.github.ecvrakamanescript.azyron.core.module.setting.Setting;

import java.io.IOException;
import java.io.Writer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Converts the modules and their settings to JSON and back.
 * <pre>
 * {
 *   "version": 1,
 *   "modules": {
 *     "fps": { "enabled": true, "settings": { "scale": 1.0, "color": "#FF7C3AED" } }
 *   }
 * }
 * </pre>
 * Colors are written as "#AARRGGBB" and keys by their Minecraft key name ("key.keyboard.c").
 */
final class ConfigJson {
    /** Format version of the file. Raise it when the format changes in an incompatible way. */
    static final int VERSION = 1;

    /** "#RRGGBB" or "#AARRGGBB". */
    private static final Pattern COLOR = Pattern.compile("#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})");

    private ConfigJson() {
    }

    static void write(Writer out, ModuleManager manager) throws IOException {
        JsonWriter json = new JsonWriter(out);
        json.setIndent("  ");
        json.beginObject();
        json.name("version").value(VERSION);
        json.name("modules").beginObject();
        for (Module module : manager.all()) {
            json.name(module.id()).beginObject();
            json.name("enabled").value(module.isEnabled());
            json.name("settings").beginObject();
            for (Setting<?> setting : module.settings()) {
                writeSetting(json, setting);
            }
            json.endObject();
            json.endObject();
        }
        json.endObject();
        json.endObject();
        json.flush();
        out.write('\n');
    }

    private static void writeSetting(JsonWriter json, Setting<?> setting) throws IOException {
        if (setting instanceof BooleanSetting) {
            json.name(setting.id()).value(((BooleanSetting) setting).get());
        } else if (setting instanceof NumberSetting) {
            json.name(setting.id()).value(((NumberSetting) setting).get());
        } else if (setting instanceof ColorSetting) {
            json.name(setting.id()).value(String.format(Locale.ROOT, "#%08X", ((ColorSetting) setting).get()));
        } else if (setting instanceof KeySetting) {
            json.name(setting.id()).value(((KeySetting) setting).get());
        } else if (setting instanceof ChoiceSetting) {
            json.name(setting.id()).value(((ChoiceSetting) setting).get());
        }
        // Other setting types are not stored
    }

    /**
     * Applies the parsed file to the modules. A problem with one entry becomes a warning, and that
     * entry gets its default value; all other entries are still applied.
     */
    static void apply(Map<String, Object> root, ModuleManager manager, List<String> warnings) {
        if (!root.containsKey("version")) {
            warnings.add("Missing \"version\", reading the file as version " + VERSION);
        } else if (!Double.valueOf(VERSION).equals(root.get("version"))) {
            warnings.add("Unsupported version " + describe(root.get("version")) + ", reading the file as version " + VERSION);
        }
        for (String key : root.keySet()) {
            if (!key.equals("version") && !key.equals("modules")) {
                warnings.add("Unknown entry \"" + key + "\" ignored");
            }
        }
        if (!root.containsKey("modules")) {
            return;
        }
        Map<String, Object> modules = asObject(root.get("modules"));
        if (modules == null) {
            warnings.add("modules: expected an object but found " + describe(root.get("modules")) + ", using default values");
            return;
        }
        for (Map.Entry<String, Object> entry : modules.entrySet()) {
            String path = "modules." + entry.getKey();
            Optional<Module> module = manager.get(entry.getKey());
            if (!module.isPresent()) {
                warnings.add(path + ": unknown module ignored");
                continue;
            }
            Map<String, Object> values = asObject(entry.getValue());
            if (values == null) {
                warnings.add(path + ": expected an object but found " + describe(entry.getValue()) + ", using default values");
                continue;
            }
            applyModule(module.get(), values, path, warnings);
        }
    }

    private static void applyModule(Module module, Map<String, Object> values, String path, List<String> warnings) {
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            String key = entry.getKey();
            if (key.equals("enabled")) {
                if (entry.getValue() instanceof Boolean) {
                    module.setEnabled((Boolean) entry.getValue());
                } else {
                    warnings.add(path + ".enabled: invalid value " + describe(entry.getValue()) + ", using the default value");
                    module.setEnabled(module.isEnabledByDefault());
                }
            } else if (key.equals("settings")) {
                Map<String, Object> settings = asObject(entry.getValue());
                if (settings == null) {
                    warnings.add(path + ".settings: expected an object but found " + describe(entry.getValue()) + ", using default values");
                    continue;
                }
                for (Map.Entry<String, Object> setting : settings.entrySet()) {
                    String settingPath = path + ".settings." + setting.getKey();
                    Optional<Setting<?>> target = module.setting(setting.getKey());
                    if (target.isPresent()) {
                        applySetting(target.get(), setting.getValue(), settingPath, warnings);
                    } else {
                        warnings.add(settingPath + ": unknown setting ignored");
                    }
                }
            } else {
                warnings.add(path + "." + key + ": unknown entry ignored");
            }
        }
    }

    private static void applySetting(Setting<?> setting, Object value, String path, List<String> warnings) {
        try {
            if (setting instanceof BooleanSetting && value instanceof Boolean) {
                ((BooleanSetting) setting).set((Boolean) value);
                return;
            }
            if (setting instanceof NumberSetting && value instanceof Double && isFinite((Double) value)) {
                ((NumberSetting) setting).set((Double) value);
                return;
            }
            if (setting instanceof KeySetting && value instanceof String) {
                ((KeySetting) setting).set((String) value);
                return;
            }
            if (setting instanceof ColorSetting && value instanceof String && COLOR.matcher((String) value).matches()) {
                ((ColorSetting) setting).set(parseColor((String) value));
                return;
            }
            if (setting instanceof ChoiceSetting && value instanceof String) {
                ((ChoiceSetting) setting).set((String) value);
                return;
            }
            warnings.add(path + ": invalid value " + describe(value) + ", using the default value");
        } catch (IllegalArgumentException e) {
            warnings.add(path + ": " + e.getMessage() + ", using the default value");
        }
        setting.reset();
    }

    private static int parseColor(String value) {
        String hex = value.substring(1);
        // Without alpha the color is opaque
        return hex.length() == 6 ? 0xFF000000 | Integer.parseInt(hex, 16) : (int) Long.parseLong(hex, 16);
    }

    private static boolean isFinite(double value) {
        return !Double.isNaN(value) && !Double.isInfinite(value);
    }

    private static boolean isInt(double value) {
        return value == Math.rint(value) && value >= Integer.MIN_VALUE && value <= Integer.MAX_VALUE;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asObject(Object value) {
        return value instanceof Map ? (Map<String, Object>) value : null;
    }

    /** Short description of a JSON value for warnings. */
    private static String describe(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return "\"" + value + "\"";
        }
        if (value instanceof Map) {
            return "an object";
        }
        if (value instanceof List) {
            return "an array";
        }
        if (value instanceof Double && isInt((Double) value)) {
            return String.valueOf(((Double) value).intValue());
        }
        return String.valueOf(value);
    }
}
