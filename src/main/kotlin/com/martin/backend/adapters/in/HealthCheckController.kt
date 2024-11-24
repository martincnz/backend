package com.martin.backend.adapters.`in`

import com.martin.backend.application.VertxExtensions.respondWithJsonBody
import io.vertx.ext.web.RoutingContext

class HealthCheckController {

    fun healthStatus(context: RoutingContext) {
        context.respondWithJsonBody(
            body = mapOf("status" to "UP")
        )
    }
}
