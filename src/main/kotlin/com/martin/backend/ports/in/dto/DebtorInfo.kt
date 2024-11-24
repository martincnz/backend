package com.martin.backend.ports.`in`.dto

import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.HistoricalDebtInfo
import com.martin.backend.ports.out.dto.RejectedChecksInfo

data class DebtorInfo(
    val person: Person?,
    val currentPeriodDebt: DebtInfo?,
    val historicalDebts: HistoricalDebtInfo?,
    val rejectedChecks: RejectedChecksInfo?
) {
    data class Person(
        val name: String,
        val cuilIdentifier: Long,
        val dniIdentifier: Long
    )
}
