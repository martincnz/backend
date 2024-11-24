package com.martin.backend.application

import com.martin.backend.adapters.`in`.WebServerVerticle
import com.martin.backend.application.configuration.ModuleDefinitions
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import org.koin.core.Koin
import org.koin.core.component.KoinComponent
import org.koin.core.context.startKoin
import org.koin.core.context.stopKoin
import org.slf4j.LoggerFactory

class MainVerticle : CoroutineVerticle(), KoinComponent {

    override suspend fun start() {
        try {
            val koin = startKoin {
                modules(ModuleDefinitions.createModules(vertx))
            }
            logger.info("Koin initialized successfully")
            deployServerVerticle(koin.koin)
        } catch (e: Exception) {
            logger.error("Failed to start application", e)
            throw e
        }
    }

    override suspend fun stop() {
        try {
            stopKoin()
            super<CoroutineVerticle>.stop()
            logger.info("Application stopped successfully")
        } catch (e: Exception) {
            logger.error("Error stopping application", e)
            throw e
        }
    }

    private suspend fun deployServerVerticle(koin: Koin) {
        val serverVerticle = koin.get<WebServerVerticle>()
        try {
            vertx.deployVerticle(serverVerticle).coAwait()
            logger.info("Server verticle deployed successfully")
        } catch (e: Exception) {
            logger.error("Failed to deploy server verticle", e)
            throw e
        }
    }

    companion object {
        private val logger = LoggerFactory.getLogger(MainVerticle::class.java)
    }
}
