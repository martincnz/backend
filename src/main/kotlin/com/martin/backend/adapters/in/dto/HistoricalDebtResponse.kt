package com.martin.backend.adapters.`in`.dto

import com.martin.backend.domain.dto.DebtorClassification
import java.time.LocalDate

data class HistoricalDebtResponse(
    val periods: List<HistoricalPeriod>
) {
    data class HistoricalPeriod(
        val period: LocalDate?,
        val entities: List<HistoricalEntity>
    )

    data class HistoricalEntity(
        val entity: String?,
        val situation: DebtorClassification,
        val amount: Double?,
        val underReview: Boolean,
        val hasLegalProceedings: Boolean
    )
}



