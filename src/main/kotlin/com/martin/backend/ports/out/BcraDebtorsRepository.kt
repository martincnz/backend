package com.martin.backend.ports.out

import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.HistoricalDebtInfo
import com.martin.backend.ports.out.dto.RejectedChecksInfo
import com.martin.backend.ports.out.dto.RepositoryResult

typealias CurrentDebtResult = RepositoryResult<DebtInfo>
typealias HistoricalDebtResult = RepositoryResult<HistoricalDebtInfo>
typealias RejectedChecksResult = RepositoryResult<RejectedChecksInfo>

interface BcraDebtorsRepository {
    suspend fun getCurrentPeriodDebt(identification: Long): CurrentDebtResult
    suspend fun getHistoricalDebts(identification: Long): HistoricalDebtResult
    suspend fun getRejectedChecks(identification: Long): RejectedChecksResult
}
