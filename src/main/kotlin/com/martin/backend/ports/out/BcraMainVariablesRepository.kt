package com.martin.backend.ports.out

import com.martin.backend.ports.out.dto.BcraVariable
import com.martin.backend.ports.out.dto.RepositoryResult

typealias BcraVariablesResult = RepositoryResult<List<BcraVariable>>

interface BcraMainVariablesRepository {
    suspend fun get(): BcraVariablesResult
}
