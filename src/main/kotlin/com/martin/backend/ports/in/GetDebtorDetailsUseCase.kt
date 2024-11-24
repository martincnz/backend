package com.martin.backend.ports.`in`

import com.martin.backend.domain.dto.GetDebtorsCommand
import com.martin.backend.ports.`in`.dto.DebtorInfo

interface GetDebtorDetailsUseCase {
    suspend operator fun invoke(command: GetDebtorsCommand): DebtorInfo
}
