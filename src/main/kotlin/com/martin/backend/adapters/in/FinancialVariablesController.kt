package com.martin.backend.adapters.`in`

import com.martin.backend.adapters.`in`.dto.FinancialVariablesResponseBody
import com.martin.backend.application.VertxExtensions.respondWithJsonBody
import com.martin.backend.domain.dto.GetFinancialVariablesCommand
import com.martin.backend.ports.`in`.GetFinancialVariablesUseCase
import com.martin.backend.ports.out.dto.BcraVariable
import io.vertx.ext.web.RoutingContext
import org.slf4j.LoggerFactory

class FinancialVariablesController(
    private val useCase: GetFinancialVariablesUseCase
) {
    suspend fun getFinancialVariables(context: RoutingContext) {
        logger.info("Getting main variables")
        val response = useCase(
            command = GetFinancialVariablesCommand("xd")
        ).toResponseBody()

        context.respondWithJsonBody(body = response)
    }

    private fun List<BcraVariable>.toResponseBody() =
        FinancialVariablesResponseBody(
            financialVariables = this.map {
                FinancialVariablesResponseBody.FinancialVariable(
                    id = it.id,
                    cdSeries = it.series,
                    description = it.description,
                    timestamp = it.timestamp,
                    value = it.value,
                )
            }
        )

    companion object {
        private val logger = LoggerFactory.getLogger(FinancialVariablesController::class.java)
    }

}
