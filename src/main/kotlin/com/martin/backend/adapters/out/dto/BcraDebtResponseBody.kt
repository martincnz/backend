package com.martin.backend.adapters.out.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.martin.backend.application.utils.YearMonthDeserializer
import java.time.LocalDate

data class BcraDebtResponseBody(
    val results: BcraDebt
) {
    data class BcraDebt(
        val identificacion: Long,
        val denominacion: String?,
        val periodos: List<BcraDebtPeriod>?
    )

    data class BcraDebtPeriod(
        @JsonDeserialize(using = YearMonthDeserializer::class)
        val periodo: LocalDate?,
        val entidades: List<BcraDebtEntity>?
    )

    data class BcraDebtEntity(
        val entidad: String?,
        val situacion: Int?,
        @JsonProperty("fechaSit1")
        val fechaSituacion: LocalDate?,
        val monto: Double?,
        val diasAtrasoPago: Double?,
        val refinanciaciones: Boolean,
        val recategorizacionOblig: Boolean,
        val situacionJuridica: Boolean,
        val irrecDisposicionTecnica: Boolean,
        val enRevision: Boolean,
        val procesoJud: Boolean
    )
}

