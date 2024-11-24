package com.martin.backend.application

import com.martin.backend.application.configuration.JsonMapper
import io.vertx.core.Handler
import io.vertx.ext.web.RoutingContext
import org.slf4j.LoggerFactory

class ErrorHandler: Handler<RoutingContext> {

    fun handleException(ctx: RoutingContext, e: Exception) {
        when (e) {
            is IllegalArgumentException -> ctx.fail(400, e)
            is ResourceNotFoundException -> ctx.fail(404, e)
            is SecurityException -> ctx.fail(403, e)
            is ValidationException -> ctx.fail(422, e)
            is BusinessException -> ctx.fail(409, e)
            else -> {
                logger.error("Unhandled exception in request handler", e)
                ctx.fail(500, e)
            }
        }
    }

    override fun handle(event: RoutingContext?) {
        val ctx = event!!
        val statusCode = ctx.statusCode()
        val failure = ctx.failure()

        val response = ErrorResponse(
            error = failure?.message ?: "Unknown error",
            status = statusCode,
            path = ctx.request().path(),
            timestamp = System.currentTimeMillis()
        )

        ctx.response()
            .setStatusCode(statusCode)
            .putHeader("Content-Type", "application/json")
            .end(JsonMapper.writeValue(response))
    }

    companion object {
        private val logger = LoggerFactory.getLogger(ErrorHandler::class.java)
    }
}

data class ErrorResponse(
    val error: String,
    val status: Int,
    val path: String,
    val timestamp: Long
)

sealed class ApiException(message: String, cause: Throwable? = null) : Exception(message, cause)
class ResourceNotFoundException(message: String) : ApiException(message)
class ValidationException(message: String) : ApiException(message)
class BusinessException(message: String) : ApiException(message)
