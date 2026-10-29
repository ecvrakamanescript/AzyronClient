package io.github.ecvrakamanescript.azyron.client.ui;

import io.github.ecvrakamanescript.azyron.client.AzyronClientMod;
import io.github.ecvrakamanescript.azyron.core.ui.Canvas;
import io.github.ecvrakamanescript.azyron.core.ui.FontKey;
import io.github.ecvrakamanescript.azyron.core.ui.UiScale;
import com.mojang.blaze3d.platform.Window;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.Font;
import net.minecraft.network.chat.Component;
import net.minecraft.network.chat.FontDescription;
import net.minecraft.network.chat.Style;
import net.minecraft.resources.Identifier;

import java.util.HashMap;
import java.util.Map;

//? if >=26.1 {
import net.minecraft.client.gui.GuiGraphicsExtractor;
//?} else {
/*import net.minecraft.client.gui.GuiGraphics;
*///?}

/**
 * Canvas on top of Minecraft's GUI drawing. Minecraft draws the GUI in scaled units (GUI scale);
 * this canvas scales its drawing back to real screen pixels, so all edges and the text from the
 * UI fonts land exactly on screen pixels.
 */
public final class ModernCanvas extends Canvas {
    private static final Map<FontKey, Style> STYLES = new HashMap<>();

    //? if >=26.1 {
    private final GuiGraphicsExtractor graphics;
    //?} else {
    /*private final GuiGraphics graphics;
    *///?}
    private final Font font;
    private final int width;
    private final int height;
    private int transformDepth;
    private int clipDepth;

    //? if >=26.1 {
    private ModernCanvas(GuiGraphicsExtractor graphics, float scale, int width, int height) {
    //?} else {
    /*private ModernCanvas(GuiGraphics graphics, float scale, int width, int height) {
    *///?}
        super(scale);
        this.graphics = graphics;
        this.font = Minecraft.getInstance().font;
        this.width = width;
        this.height = height;
    }

    /**
     * Starts drawing in real pixels at the UI scale of the window. Call {@link #end} when done, so
     * Minecraft's own drawing afterwards is not affected.
     */
    //? if >=26.1 {
    public static ModernCanvas begin(GuiGraphicsExtractor graphics) {
    //?} else {
    /*public static ModernCanvas begin(GuiGraphics graphics) {
    *///?}
        Window window = Minecraft.getInstance().getWindow();
        return begin(graphics, UiScale.forWindow(window.getWidth(), window.getHeight()));
    }

    /** Like the method above, but with a fixed UI scale. */
    //? if >=26.1 {
    public static ModernCanvas begin(GuiGraphicsExtractor graphics, float scale) {
    //?} else {
    /*public static ModernCanvas begin(GuiGraphics graphics, float scale) {
    *///?}
        Window window = Minecraft.getInstance().getWindow();
        int guiScale = Math.max(1, window.getGuiScale());
        graphics.pose().pushMatrix();
        graphics.pose().scale(1f / guiScale, 1f / guiScale);
        return new ModernCanvas(graphics, scale, window.getWidth(), window.getHeight());
    }

    /** Restores Minecraft's GUI scale; leftover transforms and clips are removed as well. */
    public void end() {
        while (clipDepth > 0) {
            popClip();
        }
        while (transformDepth > 0) {
            popTransform();
        }
        graphics.pose().popMatrix();
    }

    @Override
    public int width() {
        return width;
    }

    @Override
    public int height() {
        return height;
    }

    @Override
    public void pushTransform(float x, float y, float scale) {
        graphics.pose().pushMatrix();
        graphics.pose().translate(x, y);
        graphics.pose().scale(scale, scale);
        transformDepth++;
    }

    @Override
    public void popTransform() {
        if (transformDepth == 0) {
            throw new IllegalStateException("popTransform without pushTransform");
        }
        graphics.pose().popMatrix();
        transformDepth--;
    }

    @Override
    public void pushClip(int x, int y, int width, int height) {
        graphics.enableScissor(x, y, x + width, y + height);
        clipDepth++;
    }

    @Override
    public void popClip() {
        if (clipDepth == 0) {
            throw new IllegalStateException("popClip without pushClip");
        }
        graphics.disableScissor();
        clipDepth--;
    }

    @Override
    protected void drawRect(int x1, int y1, int x2, int y2, int color) {
        graphics.fill(x1, y1, x2, y2, color);
    }

    @Override
    protected void drawText(String text, FontKey key, int x, int y, int lineHeight, int color) {
        Component component = Component.literal(text).setStyle(style(key));
        int top = TextMetrics.drawY(key, y, lineHeight);
        //? if >=26.1 {
        graphics.text(font, component, x, top, color, false);
        //?} else {
        /*graphics.drawString(font, component, x, top, color, false);
        *///?}
    }

    @Override
    protected int measureText(String text, FontKey key) {
        return font.width(Component.literal(text).setStyle(style(key)));
    }

    private static Style style(FontKey key) {
        synchronized (STYLES) {
            Style style = STYLES.get(key);
            if (style == null) {
                Identifier id = Identifier.fromNamespaceAndPath(AzyronClientMod.MOD_ID, key.id());
                style = Style.EMPTY.withFont(new FontDescription.Resource(id));
                STYLES.put(key, style);
            }
            return style;
        }
    }
}
