package com.martin.backend.adapters.out

import com.martin.backend.adapters.out.dto.BcraDebtResponseBody
import com.martin.backend.adapters.out.dto.BcraHistoricalDebtResponseBody
import com.martin.backend.adapters.out.dto.BcraRejectedChecksResponseBody
import com.martin.backend.application.configuration.JsonMapper
import com.martin.backend.domain.dto.DebtorClassification
import com.martin.backend.ports.out.BcraDebtorsRepository
import com.martin.backend.ports.out.CurrentDebtResult
import com.martin.backend.ports.out.HistoricalDebtResult
import com.martin.backend.ports.out.RejectedChecksResult
import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.HistoricalDebtInfo
import com.martin.backend.ports.out.dto.RejectedChecksInfo
import com.martin.backend.ports.out.dto.RepositoryResult
import io.vertx.ext.web.client.WebClient
import io.vertx.kotlin.coroutines.coAwait

class BcraDebtorsRepositoryImpl(
    private val client: WebClient
) : BcraDebtorsRepository {

    override suspend fun getCurrentPeriodDebt(identification: Long): CurrentDebtResult {
        val response = client.getAbs("$BASE_URL/Deudas/$identification")
            .send()
            .coAwait()

        return when (response.statusCode()) {
            200 -> RepositoryResult.Success(
                data = JsonMapper.readValue<BcraDebtResponseBody>(response.bodyAsString()).toDebtInfo()
            )
            else -> RepositoryResult.Failure(error = response.bodyAsString())
        } as CurrentDebtResult
    }

    private fun BcraDebtResponseBody.toDebtInfo(): DebtInfo {
        return this.results.let {
            DebtInfo(
                identification = it.identificacion,
                name = it.denominacion,
                periods = it.periodos?.map {
                    DebtInfo.Period(
                        period = it.periodo,
                        entities = it.entidades?.map {
                            DebtInfo.DebtEntity(
                                entity = it.entidad,
                                debtorClassification = DebtorClassification.fromCode(it.situacion),
                                situationDate = it.fechaSituacion,
                                amount = it.monto,
                                daysOverdue = it.diasAtrasoPago,
                                hasRefinancing = it.refinanciaciones,
                                mandatoryRecategorization = it.recategorizacionOblig,
                                hasLegalSituation = it.situacionJuridica,
                                hasTechnicalIrregularity = it.irrecDisposicionTecnica,
                                underReview = it.enRevision,
                                hasLegalProceedings = it.procesoJud
                            )
                        }
                    )
                }
            )
        }
    }

    override suspend fun getHistoricalDebts(identification: Long): HistoricalDebtResult {
        val response = client.getAbs("$BASE_URL/Deudas/Historicas/$identification")
            .send()
            .coAwait()

        return when (response.statusCode()) {
            200 -> RepositoryResult.Success(
                data = JsonMapper.readValue<BcraHistoricalDebtResponseBody>(response.bodyAsString()).toHistoricalDebtInfo()
            )
            else -> RepositoryResult.Failure(error = response.bodyAsString())
        } as HistoricalDebtResult
    }

    private fun BcraHistoricalDebtResponseBody.toHistoricalDebtInfo() =
        HistoricalDebtInfo(
            periods = this.results.periodos?.map {
                HistoricalDebtInfo.Period(
                    period = it.periodo,
                    entities = it.entidades?.map {
                        HistoricalDebtInfo.Entity(
                            entity = it.entidad,
                            situation = DebtorClassification.fromCode(it.situacion),
                            amount = it.monto,
                            underReview = it.enRevision,
                            hasLegalProceedings = it.procesoJud
                        )
                    } ?: emptyList()
                )
            } ?: emptyList()
        )

    override suspend fun getRejectedChecks(identification: Long): RejectedChecksResult {
        val response = client.getAbs("$BASE_URL/Deudas/ChequesRechazados/$identification")
            .send()
            .coAwait()

        return when (response.statusCode()) {
            200 -> RepositoryResult.Success(
                data = JsonMapper.readValue<BcraRejectedChecksResponseBody>(response.bodyAsString()).toRejectedChecksInfo()
            )
            else -> RepositoryResult.Failure(error = response.bodyAsString())
        } as RejectedChecksResult
    }

    private fun BcraRejectedChecksResponseBody.toRejectedChecksInfo() =
        this.results.let {
            RejectedChecksInfo(
                identification = it.identificacion,
                name = it.denominacion,
                causes = it.causales?.map {
                    RejectedChecksInfo.Cause(
                        cause = it.causal,
                        entities = it.entidades?.map {
                            RejectedChecksInfo.Entity(
                                entity = it.entidad,
                                details = it.detalle?.map {
                                    RejectedChecksInfo.Detail(
                                        checkNumber = it.nroCheque,
                                        rejectionDate = it.fechaRechazo,
                                        amount = it.monto,
                                        paymentDate = it.fechaPago,
                                        finePaymentDate = it.fechaPagoMulta,
                                        fineStatus = it.estadoMulta,
                                        isPersonalAccount = it.ctaPersonal,
                                        legalName = it.denomJuridica,
                                        underReview = it.enRevision,
                                        hasLegalProceedings = it.procesoJud
                                    )
                                } ?: emptyList()
                            )
                        } ?: emptyList()
                    )
                } ?: emptyList()
            )
        }

    companion object {
        private const val BASE_URL = "https://api.bcra.gob.ar/centraldedeudores/v1.0"
    }
}
