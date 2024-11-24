package com.martin.backend.application.configuration.data

data class AppConfig(
    val server: ServerConfig
) {
    companion object {
        fun default() = AppConfig(
            server = ServerConfig.default()
        )
    }
}

data class ServerConfig(
    val port: Int,
    val host: String
) {
    companion object {
        fun default() = ServerConfig(
            port = 8080,
            host = "0.0.0.0"
        )
    }
}
