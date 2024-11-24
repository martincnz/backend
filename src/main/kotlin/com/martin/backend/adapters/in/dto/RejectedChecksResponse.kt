package com.martin.backend.adapters.`in`.dto

import java.time.LocalDate

data class RejectedChecksResponse(
    val causes: List<CheckCause>
) {
    data class CheckCause(
        val cause: String?,
        val entities: List<CheckEntity>
    )

    data class CheckEntity(
        val entity: Long?,
        val details: List<CheckDetail>
    )

    data class CheckDetail(
        val checkNumber: Double,
        val rejectionDate: LocalDate,
        val amount: Double,
        val paymentDate: LocalDate?,
        val finePaymentDate: LocalDate?,
        val fineStatus: String?,
        val isPersonalAccount: Boolean,
        val legalName: String?,
        val underReview: Boolean,
        val hasLegalProceedings: Boolean
    )
}

