package com.martin.backend.domain.dto

import com.martin.backend.domain.Param

data class GetDebtorsCommand(
    val identification: Long,
    val includes: Set<Param?>,
)
