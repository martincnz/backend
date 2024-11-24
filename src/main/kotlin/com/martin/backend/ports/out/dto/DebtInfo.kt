package com.martin.backend.ports.out.dto

import com.martin.backend.domain.dto.DebtorClassification
import java.time.LocalDate

data class DebtInfo(
    val identification: Long,
    val name: String?,
    val periods: List<Period>?
) {
    data class Period(
        val period: LocalDate?,
        val entities: List<DebtEntity>?
    )

    data class DebtEntity(
        val entity: String?,
        val debtorClassification: DebtorClassification,
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




