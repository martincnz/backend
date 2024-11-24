package com.martin.backend.adapters.out

import com.martin.backend.adapters.out.dto.BcraVariablesResponseBody
import com.martin.backend.application.configuration.JsonMapper
import com.martin.backend.ports.out.BcraMainVariablesRepository
import com.martin.backend.ports.out.BcraVariablesResult
import com.martin.backend.ports.out.dto.BcraVariable
import com.martin.backend.ports.out.dto.RepositoryResult
import io.vertx.core.buffer.Buffer
import io.vertx.ext.web.client.HttpResponse
import io.vertx.ext.web.client.WebClient
import io.vertx.kotlin.coroutines.coAwait
import java.time.Instant
import org.slf4j.Logger
import org.slf4j.LoggerFactory

class BcraMainVariablesRepositoryImpl(
    private val client: WebClient
) : BcraMainVariablesRepository {

    override suspend fun get(): BcraVariablesResult {
        log.info("Getting main variables")
        println("Getting main variables")
        val response = client.getAbs(
            BCRA_VARIABLES_API_URL
        )
            .send()
            .coAwait()

        return when (response.statusCode()) {
            200 -> response.toSuccessResult()

            else -> RepositoryResult.Failure(
                error = response.bodyAsString()
            )
        } as BcraVariablesResult
    }

    private fun HttpResponse<Buffer>.toSuccessResult(): BcraVariablesResult =
        RepositoryResult.Success(
            data = JsonMapper
                .readValue<BcraVariablesResponseBody>(this.bodyAsString())
                .toVariablesList()
        )


    private fun BcraVariablesResponseBody.toVariablesList() =
        results.map {
            BcraVariable(
                id = it.idVariable,
                series = it.cdSerie,
                description = it.descripcion,
                timestamp = Instant.now(),
                value = it.valor
            )
        }

    companion object {
        private const val BCRA_VARIABLES_API_URL =
            "https://api.bcra.gob.ar/estadisticas/v2.0/PrincipalesVariables"
        private val log: Logger = LoggerFactory.getLogger(BcraMainVariablesRepositoryImpl::class.java)
    }
}
