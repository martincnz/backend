package com.martin.backend.adapters.`in`.dto

import com.martin.backend.domain.dto.DebtorClassification
import java.time.LocalDate

data class DebtResponseBody(
    val entities: List<DebtEntity>?
) {
    data class DebtEntity(
        val entity: String?,
        val situation: DebtorClassification,
        val situationDate: LocalDate?,
        val amount: Double?,
        val daysOverdue: Double?,
        val hasRefinancing: Boolean,
        val mandatoryRecategorization: Boolean,
        val hasLegalSituation: Boolean,
        val hasTechnicalIrregularity: Boolean,
        val underReview: Boolean,
        val hasLegalProceedings: Boolean
    )
}

