package com.martin.backend.domain.dto

enum class DebtorClassification(
    val code: Int
) {
    NORMAL(1),
    SPECIAL_FOLLOWING(2),
    WITH_PROBLEMS(3),
    HIGH_INSOLVENCY_RISK(4),
    IRRECOVERABLE(5),

    UNKNOWN(-1);

    companion object {
        fun fromCode(code: Int?): DebtorClassification =
            entries.find { it.code == code } ?: UNKNOWN
    }
}
