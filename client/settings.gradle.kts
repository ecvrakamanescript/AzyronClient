pluginManagement {
    repositories {
        maven("https://maven.fabricmc.net/") {
            name = "Fabric"
        }
        gradlePluginPortal()
    }
}

rootProject.name = "azyron-client"

// Version-independent core (no Minecraft code)
include("core")
// Fabric client for modern Minecraft versions
include("modern")
