package com.martin.backend.ports.out.dto

import com.martin.backend.domain.dto.DebtorClassification
import java.time.LocalDate


data class HistoricalDebtInfo(
    val periods: List<Period>
) {
    data class Period(
        val period: LocalDate?,
        val entities: List<Entity>
    )

    data class Entity(
        val entity: String?,
        val situation: DebtorClassification,
        val amount: Double?,
        val underReview: Boolean,
        val hasLegalProceedings: Boolean
    )
}


