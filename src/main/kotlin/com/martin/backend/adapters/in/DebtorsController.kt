package com.martin.backend.adapters.`in`

import com.martin.backend.adapters.`in`.dto.AdditionalInfoResponseBody
import com.martin.backend.adapters.`in`.dto.DebtResponseBody
import com.martin.backend.adapters.`in`.dto.DebtResponseBody.DebtEntity
import com.martin.backend.adapters.`in`.dto.DebtorsResponseBody
import com.martin.backend.adapters.`in`.dto.HistoricalDebtResponse
import com.martin.backend.adapters.`in`.dto.HistoricalDebtResponse.HistoricalEntity
import com.martin.backend.adapters.`in`.dto.HistoricalDebtResponse.HistoricalPeriod
import com.martin.backend.application.VertxExtensions.respondWithJsonBody
import com.martin.backend.domain.Param
import com.martin.backend.domain.dto.GetDebtorsCommand
import com.martin.backend.ports.`in`.GetDebtorDetailsUseCase
import com.martin.backend.ports.`in`.dto.DebtorInfo
import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.HistoricalDebtInfo
import com.martin.backend.ports.out.dto.PersonInfo
import io.vertx.ext.web.RoutingContext
import org.slf4j.LoggerFactory

class DebtorsController(
    private val getDebtorDetailsUseCase: GetDebtorDetailsUseCase
) {
    suspend fun getDebtorInfo(context: RoutingContext) {
        val identification = context.pathParam("identification").toLongOrNull()
            ?: throw IllegalArgumentException("Invalid identification")
        val includes = context.queryParam("include")
            .flatMap { it.split(",") }
            .map { Param.from(it.trim()) }.toSet()

        logger.info("Getting debtor info for identification: $identification")

        val response = getDebtorDetailsUseCase(
            command = GetDebtorsCommand(
                identification = identification,
                includes = includes
            )
        ).toResponseBody()

        context.respondWithJsonBody(body = response)
    }

    private fun DebtorInfo.toResponseBody() =
        DebtorsResponseBody(
            person = this.person,
            summary = this.debtSummary,
            currentPeriod = this.currentPeriodDebt?.toDebtResponse(),
            history = this.historicalDebts?.toHistoryResponse(),
            rejectedChecks = null,
            additionalInfo = this.additionalInfo?.toResponseBody()
        )

    private fun DebtInfo.toDebtResponse() =
        DebtResponseBody(
            period = this.period,
            entities = this.entities?.map {
                DebtEntity(
                    entity = it.entity,
                    situation = it.debtorClassification,
                    situationDate = it.situationDate,
                    amount = it.amount,
                    daysOverdue = it.daysOverdue,
                    hasRefinancing = it.hasRefinancing,
                    mandatoryRecategorization = it.mandatoryRecategorization,
                    hasLegalSituation = it.hasLegalSituation,
                    hasTechnicalIrregularity = it.hasTechnicalIrregularity,
                    underReview = it.underReview,
                    hasLegalProceedings = it.hasLegalProceedings,
                )
            }
        )

    private fun HistoricalDebtInfo.toHistoryResponse() =
        HistoricalDebtResponse(
            periods = this.periods.map {
                HistoricalPeriod(
                    period = it.period,
                    entities = it.entities.map {
                        HistoricalEntity(
                            entity = it.entity,
                            situation = it.situation,
                            amount = it.amount,
                            underReview = it.underReview,
                            hasLegalProceedings = it.hasLegalProceedings,
                        )
                    }
                )
            }
        )

    private fun PersonInfo.toResponseBody() =
        AdditionalInfoResponseBody(
            personType = this.personType,
            fiscalAddress = this.fiscalAddress.let {
                AdditionalInfoResponseBody.FiscalAddress(
                    postalCode = it.postalCode,
                    province = it.province,
                    provinceId = it.provinceId,
                    direction = it.direction,
                    addressType = it.addressType,
                )
            }
        )

    companion object {
        private val logger = LoggerFactory.getLogger(DebtorsController::class.java)
    }
}
