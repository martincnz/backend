package com.martin.backend.application.configuration

import io.vertx.core.Vertx
import io.vertx.ext.web.client.CachingWebClient
import io.vertx.ext.web.client.CachingWebClientOptions
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions

object WebClientCreator {

    fun createCachingWebClient(vertx: Vertx): WebClient {
        val cachingOptions = CachingWebClientOptions()
            .removeCachedStatusCode(301)
            .setEnableVaryCaching(true)

        return CachingWebClient.create(
            createWebClient(vertx),
            cachingOptions
        )
    }

    fun createWebClient(vertx: Vertx): WebClient {
        val options = WebClientOptions()
            .setSsl(true)
            .setTrustAll(true)
            .setVerifyHost(false)

        return WebClient.create(vertx, options)
    }
}
