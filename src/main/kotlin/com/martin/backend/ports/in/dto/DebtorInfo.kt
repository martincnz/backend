package com.martin.backend.ports.`in`.dto

import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.HistoricalDebtInfo
import com.martin.backend.ports.out.dto.PersonInfo
import com.martin.backend.ports.out.dto.RejectedChecksInfo
import java.time.LocalDate

data class DebtorInfo(
    val person: Person?,
    val debtSummary: DebtSummary?,
    val currentPeriodDebt: DebtInfo?,
    val historicalDebts: HistoricalDebtInfo?,
    val rejectedChecks: RejectedChecksInfo?,
    val additionalInfo: PersonInfo?
) {
    data class DebtSummary(
        val totalAmount: Double,
        val averageAmount: Double,
        val maxAmountPeriod: MaxAmountPeriod
    ) {
        data class MaxAmountPeriod(
            val amount: Double?,
            val period: LocalDate?,
        )
    }

    data class Person(
        val name: String,
        val cuilIdentifier: Long,
        val dniIdentifier: Long?
    )
}
