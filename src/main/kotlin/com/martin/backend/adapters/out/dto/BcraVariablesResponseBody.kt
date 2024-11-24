package com.martin.backend.adapters.out.dto

import com.fasterxml.jackson.annotation.JsonCreator

data class BcraVariablesResponseBody(
    val results: List<BcraVariableResponse>
) {
    data class BcraVariableResponse @JsonCreator constructor(
        val idVariable: Int,
        val cdSerie: Int,
        val descripcion: String,
        val fecha: String,
        val valor: Double,
    )
}
