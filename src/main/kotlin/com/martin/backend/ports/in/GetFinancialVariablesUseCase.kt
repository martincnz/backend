package com.martin.backend.ports.`in`

import com.martin.backend.domain.dto.GetFinancialVariablesCommand
import com.martin.backend.ports.out.dto.BcraVariable

interface GetFinancialVariablesUseCase {
    suspend operator fun invoke(
        command: GetFinancialVariablesCommand
    ): List<BcraVariable>
}
