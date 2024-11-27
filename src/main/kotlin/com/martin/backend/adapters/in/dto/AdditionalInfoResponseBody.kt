package com.martin.backend.adapters.`in`.dto

data class AdditionalInfoResponseBody(
    val fiscalAddress: FiscalAddress,
    val personType: String
) {
    data class FiscalAddress(
        val postalCode: String?,
        val province: String?,
        val provinceId: Int?,
        val direction: String?,
        val addressType: String?
    )
}

