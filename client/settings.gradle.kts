pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") {
            name = "Fabric"
        }
        gradlePluginPortal()
    }
}

plugins {
    id("dev.kikugie.stonecutter") version "0.9.8"
}

rootProject.name = "azyron-client"

// Version-independent core (no Minecraft code)
include("core")

// Fabric client for modern Minecraft versions: one subproject per version in modern/versions/,
// all built from the shared sources in modern/src/
stonecutter {
    create("modern") {
        // Minecraft 1.21.11 and older is obfuscated and needs the remapping Loom plugin
        versions("1.21.11").buildscript("build.obfuscated.gradle.kts")
        versions("26.3")
    }
}
