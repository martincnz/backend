package com.martin.backend.application.configuration

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.PropertyNamingStrategies
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.KotlinModule

object JsonMapper {

    val mapper = JsonMapper.builder()
        .addModule(KotlinModule.Builder().build())
        .addModule(JavaTimeModule())
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .propertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
        .build()

    fun writeValue(value: Any?): String {
        return mapper.writeValueAsString(value)
    }

    inline fun <reified T> readValue(value: String): T {
        return mapper.readValue(value, T::class.java)
    }

}
