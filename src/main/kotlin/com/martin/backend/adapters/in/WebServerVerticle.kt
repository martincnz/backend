package com.martin.backend.adapters.`in`

import com.martin.backend.application.ErrorHandler
import com.martin.backend.application.configuration.data.AppConfig
import io.vertx.ext.web.Route
import io.vertx.ext.web.Router
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.handler.BodyHandler
import io.vertx.kotlin.coroutines.CoroutineVerticle
import io.vertx.kotlin.coroutines.coAwait
import io.vertx.kotlin.coroutines.dispatcher
import kotlinx.coroutines.launch
import org.koin.core.component.KoinComponent
import org.slf4j.LoggerFactory

class WebServerVerticle(
    private val appConfig: AppConfig,
    private val errorHandler: ErrorHandler,
    private val healthCheckController: HealthCheckController,
    private val financialVariablesController: FinancialVariablesController,
    private val debtorsController: DebtorsController,
) : CoroutineVerticle(), KoinComponent {

    override suspend fun start() {
        val router = Router.router(vertx)

        setupRoutes(router)

        try {
            val port = appConfig.server.port
            vertx.createHttpServer()
                .requestHandler(router)
                .listen(
                    port,
                    appConfig.server.host
                ).coAwait()

            logger.info("HTTP server started on port $port")
        } catch (e: Exception) {
            logger.error("Failed to start HTTP server", e)
            throw e
        }
    }

    override suspend fun stop() {
        super<CoroutineVerticle>.stop()
    }

    private fun setupRoutes(router: Router) {
        router.route()
            .handler(BodyHandler.create())
            .failureHandler(errorHandler::handle)

        router.get("/")
            .coroutineHandler(healthCheckController::healthStatus)
        router.get("/api/v1/financial-variables")
            .coroutineHandler(financialVariablesController::getFinancialVariables)
        router.get("/api/v1/debtors/:identification")
            .coroutineHandler(debtorsController::getDebtorInfo)
    }

    private fun Route.coroutineHandler(fn: suspend (RoutingContext) -> Unit): Route {
        return handler { ctx ->
            launch(ctx.vertx().dispatcher()) {
                try {
                    fn(ctx)
                    if (ctx.response().ended().not()) {
                        ctx.response().end()
                    }
                } catch (e: Exception) {
                    errorHandler.handleException(ctx, e)
                }
            }
        }
    }

    companion object {
        private val logger = LoggerFactory.getLogger(WebServerVerticle::class.java)
    }
}
