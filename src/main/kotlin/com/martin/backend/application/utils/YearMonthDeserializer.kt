package com.martin.backend.application.utils

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

object YearMonthDeserializer : JsonDeserializer<LocalDate>() {
    private val formatter = DateTimeFormatter.ofPattern("yyyyMM")

    override fun deserialize(p: JsonParser?, ctxt: DeserializationContext?): LocalDate? {
        val yearMonth = YearMonth.parse(p?.text.toString(), formatter)
        return yearMonth.atDay(1)
    }

}
