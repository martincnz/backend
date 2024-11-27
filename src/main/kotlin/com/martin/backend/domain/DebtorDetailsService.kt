package com.martin.backend.domain

import com.martin.backend.application.VertxExtensions.Tetrad
import com.martin.backend.application.VertxExtensions.parallelFetch
import com.martin.backend.domain.dto.GetDebtorsCommand
import com.martin.backend.ports.`in`.GetDebtorDetailsUseCase
import com.martin.backend.ports.`in`.dto.DebtorInfo
import com.martin.backend.ports.out.BcraDebtorsRepository
import com.martin.backend.ports.out.CurrentDebtResult
import com.martin.backend.ports.out.GlobalDataRepository
import com.martin.backend.ports.out.HistoricalDebtResult
import com.martin.backend.ports.out.PersonInfoResult
import com.martin.backend.ports.out.RejectedChecksResult

class DebtorDetailsService(
    private val bcraRepository: BcraDebtorsRepository,
    private val globalDataRepository: GlobalDataRepository
) : GetDebtorDetailsUseCase {

    override suspend fun invoke(command: GetDebtorsCommand): DebtorInfo {
        val includes = command.includes
        val includeAddress = includes.contains(Param.ADDRESS_INFO)
        val includeSummary = includes.contains(Param.SUMMARY)

        val results = fetchAllData(
            personId = command.identification,
            includeAddressInfo = includeAddress
        )

        return DebtorInfoAssembler.assemble(
            results = results,
            generateSummary = includeSummary
        )
    }

    private suspend fun fetchAllData(
        personId: Long,
        includeAddressInfo: Boolean
    ): Tetrad<CurrentDebtResult, HistoricalDebtResult, RejectedChecksResult, PersonInfoResult?> {
        return if (includeAddressInfo) {
            parallelFetch(
                { bcraRepository.getCurrentPeriodDebt(personId) },
                { bcraRepository.getHistoricalDebts(personId) },
                { bcraRepository.getRejectedChecks(personId) },
                { globalDataRepository.getPersonInfo(personId) }
            )
        } else {
            val (current, historical, rejected) = parallelFetch(
                { bcraRepository.getCurrentPeriodDebt(personId) },
                { bcraRepository.getHistoricalDebts(personId) },
                { bcraRepository.getRejectedChecks(personId) }
            )
            Tetrad(current, historical, rejected, null)
        }
    }
}
