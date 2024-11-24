package com.martin.backend.ports.out.dto

sealed class RepositoryResult<T> {
    data class Success<T>(val data: T) : RepositoryResult<T>()
    data class Failure(val error: String) : RepositoryResult<Nothing>()
}
