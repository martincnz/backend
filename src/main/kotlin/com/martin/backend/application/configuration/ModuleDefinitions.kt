package com.martin.backend.application.configuration

import com.martin.backend.adapters.`in`.DebtorsController
import com.martin.backend.adapters.`in`.FinancialVariablesController
import com.martin.backend.adapters.`in`.HealthCheckController
import com.martin.backend.adapters.`in`.WebServerVerticle
import com.martin.backend.adapters.out.BcraDebtorsRepositoryImpl
import com.martin.backend.adapters.out.BcraMainVariablesRepositoryImpl
import com.martin.backend.adapters.out.GlobalDataRepositoryImpl
import com.martin.backend.application.ErrorHandler
import com.martin.backend.domain.DebtorDetailsService
import com.martin.backend.domain.FinancialVariablesService
import com.martin.backend.ports.`in`.GetDebtorDetailsUseCase
import com.martin.backend.ports.`in`.GetFinancialVariablesUseCase
import com.martin.backend.ports.out.BcraDebtorsRepository
import com.martin.backend.ports.out.BcraMainVariablesRepository
import com.martin.backend.ports.out.GlobalDataRepository
import io.vertx.core.Vertx
import io.vertx.ext.web.client.CachingWebClient
import io.vertx.ext.web.client.CachingWebClientOptions
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
import org.koin.dsl.module


object ModuleDefinitions {
    fun createModules(vertx: Vertx) = listOf(
        createConfigModule(),
        createAppModule(),
        createControllersModule(),
        createUseCasesModule(),
        createWebClientModule(vertx),
        createRepositoriesModule()
    )

    private fun createConfigModule() = module {
        single { ConfigurationLoader().load() }
    }

    private fun createAppModule() = module {
        single {
            WebServerVerticle(
                healthCheckController = get(),
                financialVariablesController = get(),
                errorHandler = get(),
                appConfig = get(),
                debtorsController = get()
            )
        }
    }

    private fun createControllersModule() = module {
        single { ErrorHandler() }
        single { HealthCheckController() }

        single {
            FinancialVariablesController(
                useCase = get()
            )
        }
        single {
            DebtorsController(
                getDebtorDetailsUseCase = get()
            )
        }
    }

    private fun createUseCasesModule() = module {
        single<GetFinancialVariablesUseCase> {
            FinancialVariablesService(
                bcraMainVariablesRepository = get()
            )
        }
        single<GetDebtorDetailsUseCase> {
            DebtorDetailsService(
                bcraRepository = get(),
                globalDataRepository = get()
            )
        }
    }

    private fun createWebClientModule(vertx: Vertx) = module {
        val cachingOptions = CachingWebClientOptions()
            .removeCachedStatusCode(301)
            .setEnableVaryCaching(true)

        val options = WebClientOptions()
            .setSsl(true)
            .setTrustAll(true)
            .setVerifyHost(false)

        val client = WebClient.create(vertx, options)

        single<WebClient> {
            CachingWebClient.create(client, cachingOptions)
        }
    }

    private fun createRepositoriesModule() = module {
        single<BcraMainVariablesRepository> {
            BcraMainVariablesRepositoryImpl(
                client = get()
            )
        }

        single<BcraDebtorsRepository> {
            BcraDebtorsRepositoryImpl(
                client = get()
            )
        }

        single<GlobalDataRepository> {
            GlobalDataRepositoryImpl(
                client = get()
            )
        }
    }
}
