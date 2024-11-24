package com.martin.backend.application.configuration

import com.martin.backend.adapters.`in`.DebtorsController
import com.martin.backend.adapters.`in`.FinancialVariablesController
import com.martin.backend.adapters.`in`.HealthCheckController
import com.martin.backend.adapters.`in`.WebServerVerticle
import com.martin.backend.adapters.out.BcraDebtorsRepositoryImpl
import com.martin.backend.adapters.out.BcraMainVariablesRepositoryImpl
import com.martin.backend.application.ErrorHandler
import com.martin.backend.domain.DebtorDetailsService
import com.martin.backend.domain.FinancialVariablesService
import com.martin.backend.ports.`in`.GetDebtorDetailsUseCase
import com.martin.backend.ports.`in`.GetFinancialVariablesUseCase
import com.martin.backend.ports.out.BcraDebtorsRepository
import com.martin.backend.ports.out.BcraMainVariablesRepository
import io.vertx.core.Vertx
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
import org.koin.dsl.module


object ModuleDefinitions {
    fun createModules(vertx: Vertx) = listOf(
        createConfigModule(),
        createAppModule(),
        createControllersModule(),
        createUseCasesModule(),
        createRepositoriesModule(vertx)
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
                bcraRepository = get()
            )
        }
    }

    private fun createRepositoriesModule(vertx: Vertx) = module {
        single {
            WebClient.create(
                vertx,
                WebClientOptions()
                    .setSsl(true)
                    .setTrustAll(true)
                    .setVerifyHost(false)
            )
        }

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
    }
}
