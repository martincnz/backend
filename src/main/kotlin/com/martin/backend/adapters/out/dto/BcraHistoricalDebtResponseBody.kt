package com.martin.backend.adapters.out.dto

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.martin.backend.application.utils.YearMonthDeserializer
import java.time.LocalDate

data class BcraHistoricalDebtResponseBody(
    val results: BcraHistoricalDebt
) {
    data class BcraHistoricalDebt(
        val identificacion: Long,
        val denominacion: String?,
        val periodos: List<BcraHistoricalPeriod>?
    )

    data class BcraHistoricalPeriod(
        @JsonDeserialize(using = YearMonthDeserializer::class)
        val periodo: LocalDate?,
        val entidades: List<BcraHistoricalEntity>?
    )

    data class BcraHistoricalEntity(
        val entidad: String?,
        val situacion: Int?,
        val monto: Double?,
        val enRevision: Boolean,
        val procesoJud: Boolean
    )
}

