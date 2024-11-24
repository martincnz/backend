package com.martin.backend.application.configuration

import com.martin.backend.application.configuration.data.AppConfig
import com.martin.backend.application.configuration.data.ServerConfig
import org.slf4j.LoggerFactory

class ConfigurationLoader {

    fun load(): AppConfig {
        return AppConfig(
            server = ServerConfig(
                port = getEnvOrDefault("SERVER_PORT", ServerConfig.default().port),
                host = getEnvOrDefault("SERVER_HOST", ServerConfig.default().host)
            )
        )
    }

    private fun getEnvOrDefault(key: String, default: String): String {
        return System.getenv(key) ?: default
    }

    private fun getEnvOrDefault(key: String, default: Int): Int {
        return System.getenv(key)?.toIntOrNull() ?: default
    }

    companion object {
        private val logger = LoggerFactory.getLogger(ConfigurationLoader::class.java)
    }
}
