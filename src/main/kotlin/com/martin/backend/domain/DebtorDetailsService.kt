package com.martin.backend.domain

import com.martin.backend.application.VertxExtensions.parallelFetch
import com.martin.backend.domain.dto.GetDebtorsCommand
import com.martin.backend.ports.`in`.GetDebtorDetailsUseCase
import com.martin.backend.ports.`in`.dto.DebtorInfo
import com.martin.backend.ports.out.BcraDebtorsRepository
import com.martin.backend.ports.out.dto.DebtInfo
import com.martin.backend.ports.out.dto.RepositoryResult

class DebtorDetailsService(
    private val bcraRepository: BcraDebtorsRepository
) : GetDebtorDetailsUseCase {

    override suspend fun invoke(command: GetDebtorsCommand): DebtorInfo {

        val (currentDebtResult, historicalDebtResult, rejectedChecksResult) = parallelFetch(
            { bcraRepository.getCurrentPeriodDebt(command.identification) },
            { bcraRepository.getHistoricalDebts(command.identification) },
            { bcraRepository.getRejectedChecks(command.identification) }
        )

        val currentDebt = when (currentDebtResult) {
            is RepositoryResult.Failure -> null
            is RepositoryResult.Success -> currentDebtResult.data
        }

        return DebtorInfo(
            person = currentDebt?.getPersonIdentifiers(),
            currentPeriodDebt = currentDebt,
            historicalDebts = when (historicalDebtResult) {
                is RepositoryResult.Failure -> null
                is RepositoryResult.Success -> historicalDebtResult.data
            },
            rejectedChecks = when (rejectedChecksResult) {
                is RepositoryResult.Failure -> null
                is RepositoryResult.Success -> rejectedChecksResult.data
            }
        )
    }

    private fun DebtInfo.getPersonIdentifiers(): DebtorInfo.Person? {
        val cuilIdentifier = this.identification
        return DebtorInfo.Person(
            name = this.name?.toPascalCase() ?: "Unknown",
            cuilIdentifier = cuilIdentifier,
            dniIdentifier = cuilIdentifier.convertToDni()
        )
    }

    private fun String.toPascalCase(): String {
        return this.lowercase()
            .split(" ")
            .filter { it.isNotEmpty() }
            .joinToString(" ") { word -> word.replaceFirstChar { it.uppercase() } }
    }

    private fun Long.convertToDni(): Long {
        val numberStr = this.toString()
        return numberStr.drop(2).dropLast(1).toLong()
    }

}
