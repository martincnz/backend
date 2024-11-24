package com.martin.backend.adapters.`in`.dto

import java.time.Instant

data class FinancialVariablesResponseBody(
    val financialVariables: List<FinancialVariable>
) {
    data class FinancialVariable(
        val id: Int,
        val cdSeries: Int,
        val description: String,
        val timestamp: Instant,
        val value: Double,
    )
}
