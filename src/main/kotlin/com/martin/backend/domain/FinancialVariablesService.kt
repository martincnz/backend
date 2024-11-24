package com.martin.backend.domain

import com.martin.backend.domain.dto.GetFinancialVariablesCommand
import com.martin.backend.ports.`in`.GetFinancialVariablesUseCase
import com.martin.backend.ports.out.BcraMainVariablesRepository
import com.martin.backend.ports.out.dto.BcraVariable
import com.martin.backend.ports.out.dto.RepositoryResult

class FinancialVariablesService(
    private val bcraMainVariablesRepository: BcraMainVariablesRepository
) : GetFinancialVariablesUseCase {

    override suspend fun invoke(command: GetFinancialVariablesCommand): List<BcraVariable> {
        val result = bcraMainVariablesRepository.get()

        return when (result) {
            is RepositoryResult.Failure -> emptyList()
            is RepositoryResult.Success -> result.data
        }
    }

}
