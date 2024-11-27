package com.martin.backend.application.configuration

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer
import com.fasterxml.jackson.module.kotlin.KotlinModule
import java.time.LocalDate
import java.time.format.DateTimeFormatter

object JsonMapper {

    private val formatter = DateTimeFormatter.ofPattern("yyyy-MM")
    private val dateSerializerModule = JavaTimeModule().apply {
        addSerializer(LocalDate::class.java, LocalDateSerializer(formatter))
    }

    val mapper = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(dateSerializerModule)
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .configure(SerializationFeature.WRITE_NULL_MAP_VALUES, false)
        .serializationInclusion(JsonInclude.Include.NON_NULL)
        .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
        .build()

    fun writeValue(value: Any?): String {
        return mapper.writeValueAsString(value)
    }

    inline fun <reified T> readValue(value: String): T {
        return mapper.readValue(value, T::class.java)
    }

}
