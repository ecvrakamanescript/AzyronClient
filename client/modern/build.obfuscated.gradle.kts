// Build script for Minecraft 1.21.11 and older (obfuscated, remapped to Mojang names).
// Keep in sync with build.gradle.kts.
plugins {
    id("net.fabricmc.fabric-loom-remap") version "1.19.3"
}

group = property("maven_group") as String
version = property("mod_version") as String

val minecraftVersion = stonecutter.current.version
val loaderVersion = property("loader_version") as String
val javaVersion = (property("java_version") as String).toInt()
val keyApi = property("fabric_key_api") as String

// Only the Fabric API modules the client uses, not the whole Fabric API
val fabricApiModules = mapOf(
    "fabric-api-base" to property("fabric_api_base_version"),
    keyApi to property("fabric_key_api_version"),
    "fabric-lifecycle-events-v1" to property("fabric_lifecycle_events_version"),
    "fabric-resource-loader-v1" to property("fabric_resource_loader_version"),
)

base {
    archivesName = "azyron-client-$minecraftVersion"
}

dependencies {
    minecraft("com.mojang:minecraft:$minecraftVersion")
    // Same class and method names as in the unobfuscated versions
    mappings(loom.officialMojangMappings())
    modImplementation("net.fabricmc:fabric-loader:$loaderVersion")

    for ((module, moduleVersion) in fabricApiModules) {
        modImplementation("net.fabricmc.fabric-api:$module:$moduleVersion")
        include("net.fabricmc.fabric-api:$module:$moduleVersion")
    }

    implementation(project(":core"))
    // Nest the core JAR inside the client JAR, so the launcher only needs one file
    include(project(":core"))
}

tasks.processResources {
    val properties = mapOf(
        "version" to project.version,
        "minecraft_version" to minecraftVersion,
        "loader_version" to loaderVersion,
        "java_version" to javaVersion,
        "fabric_key_api" to keyApi,
    )
    inputs.properties(properties)
    filesMatching("fabric.mod.json") {
        expand(properties)
    }
}

java {
    // Compiles and runs (runClient) with the Java version this Minecraft version requires
    toolchain.languageVersion = JavaLanguageVersion.of(javaVersion)
}

tasks.withType<JavaCompile>().configureEach {
    options.encoding = "UTF-8"
    options.release = javaVersion
}

tasks.jar {
    // Ship the license with the client
    from(rootDir.resolve("../LICENSE"))
}
