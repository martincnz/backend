package com.martin.backend.adapters.out.dto

import java.time.LocalDate

data class BcraRejectedChecksResponseBody(
    val results: BcraRejectedChecks
) {
    data class BcraRejectedChecks(
        val identificacion: Long,
        val denominacion: String?,
        val causales: List<BcraCheckCausal>?
    )

    data class BcraCheckCausal(
        val causal: String?,
        val entidades: List<BcraCheckEntity>?
    )

    data class BcraCheckEntity(
        val entidad: Long?,
        val detalle: List<BcraCheckDetail>?
    )

    data class BcraCheckDetail(
        val nroCheque: Double,
        val fechaRechazo: LocalDate,
        val monto: Double,
        val fechaPago: LocalDate?,
        val fechaPagoMulta: LocalDate?,
        val estadoMulta: String?,
        val ctaPersonal: Boolean,
        val denomJuridica: String?,
        val enRevision: Boolean,
        val procesoJud: Boolean
    )
}

