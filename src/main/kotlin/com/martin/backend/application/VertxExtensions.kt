package com.martin.backend.application

import com.martin.backend.application.configuration.JsonMapper
import io.vertx.core.http.HttpHeaders
import io.vertx.ext.web.RoutingContext
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

object VertxExtensions {

    fun RoutingContext.respondWithJsonBody(statusCode: Int = 200, body: Any?) = this.response()
        .setStatusCode(statusCode)
        .putHeader(HttpHeaders.CONTENT_TYPE, "application/json")
        .end(JsonMapper.writeValue(body))

    data class Triad<A, B, C>(
        val first: A,
        val second: B,
        val third: C
    )
    data class Tetrad<A, B, C, D>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D
    )
    data class Pentad<A, B, C, D, E>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D,
        val fifth: E
    )

    suspend fun <A, B> parallelFetch(
        task1: suspend () -> A,
        task2: suspend () -> B
    ): Pair<A, B> = coroutineScope {
        val deferred1 = async { task1() }
        val deferred2 = async { task2() }
        deferred1.await() to deferred2.await()
    }

    suspend fun <A, B, C> parallelFetch(
        task1: suspend () -> A,
        task2: suspend () -> B,
        task3: suspend () -> C
    ): Triad<A, B, C> = coroutineScope {
        val deferred1 = async { task1() }
        val deferred2 = async { task2() }
        val deferred3 = async { task3() }
        Triad(first = deferred1.await(), second = deferred2.await(), third = deferred3.await())
    }

    suspend fun <A, B, C, D> parallelFetch(
        task1: suspend () -> A,
        task2: suspend () -> B,
        task3: suspend () -> C,
        task4: suspend () -> D
    ): Tetrad<A, B, C, D> = coroutineScope {
        val deferred1 = async { task1() }
        val deferred2 = async { task2() }
        val deferred3 = async { task3() }
        val deferred4 = async { task4() }
        Tetrad(first = deferred1.await(), second = deferred2.await(), third = deferred3.await(), fourth = deferred4.await())
    }

    suspend fun <A, B, C, D, E> parallelFetch(
        task1: suspend () -> A,
        task2: suspend () -> B,
        task3: suspend () -> C,
        task4: suspend () -> D,
        task5: suspend () -> E
    ): Pentad<A, B, C, D, E> = coroutineScope {
        val deferred1 = async { task1() }
        val deferred2 = async { task2() }
        val deferred3 = async { task3() }
        val deferred4 = async { task4() }
        val deferred5 = async { task5() }
        Pentad(
            first = deferred1.await(),
            second = deferred2.await(),
            third = deferred3.await(),
            fourth = deferred4.await(),
            fifth = deferred5.await()
        )
    }
}

