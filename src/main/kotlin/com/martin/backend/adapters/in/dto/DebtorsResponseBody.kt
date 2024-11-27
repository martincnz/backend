package com.martin.backend.adapters.`in`.dto

import com.martin.backend.ports.`in`.dto.DebtorInfo

data class DebtorsResponseBody(
    val person: DebtorInfo.Person?,
    val summary: DebtorInfo.DebtSummary?,
    val additionalInfo: AdditionalInfoResponseBody?,
    val currentPeriod: DebtResponseBody?,
    val history: HistoricalDebtResponse?,
    val rejectedChecks: RejectedChecksResponse?,
)
