package com.martin.backend.domain

enum class Param {
    ADDRESS_INFO,
    SUMMARY;

    companion object {
        fun from(string: String): Param? =
            entries.find { it.name == string }
    }
}
