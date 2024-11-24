package com.martin.backend.ports.out.dto

import java.time.Instant

data class BcraVariable(
    val id: Int,
    val series: Int,
    val description: String,
    val timestamp: Instant,
    val value: Double,
)
