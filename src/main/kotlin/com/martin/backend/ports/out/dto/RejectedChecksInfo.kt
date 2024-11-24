package com.martin.backend.ports.out.dto

import java.time.LocalDate

data class RejectedChecksInfo(
    val identification: Long,
    val name: String?,
    val causes: List<Cause>
) {
    data class Cause(
        val cause: String?,
        val entities: List<Entity>
    )

    data class Entity(
        val entity: Long?,
        val details: List<Detail>
    )

    data class Detail(
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

