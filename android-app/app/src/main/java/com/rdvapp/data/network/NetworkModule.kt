package com.rdvapp.data.network

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

val Context.dataStore by preferencesDataStore(name = "auth_preferences")

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    private const val BASE_URL = "http://10.0.2.2:4000/api/" // For Android emulator
    private const val TIMEOUT_SECONDS = 30L
    
    private val TOKEN_KEY = stringPreferencesKey("auth_token")
    
    @Provides
    @Singleton
    fun provideJson(): Json {
        return Json {
            ignoreUnknownKeys = true
            coerceInputValues = true
            encodeDefaults = true
        }
    }
    
    @Provides
    @Singleton
    fun provideAuthInterceptor(@ApplicationContext context: Context): Interceptor {
        return object : Interceptor {
            override fun intercept(chain: Interceptor.Chain): Response {
                val originalRequest = chain.request()
                
                // Get token from DataStore
                val token = runBlocking {
                    context.dataStore.data.map { preferences ->
                        preferences[TOKEN_KEY]
                    }.first()
                }
                
                val newRequest: Request = if (token != null) {
                    originalRequest.newBuilder()
                        .addHeader("Authorization", "Bearer $token")
                        .build()
                } else {
                    originalRequest
                }
                
                return chain.proceed(newRequest)
            }
        }
    }
    
    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: Interceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}

// Utility class for managing API configuration
object ApiConfig {
    const val PRODUCTION_BASE_URL = "https://your-production-api.com/api/"
    const val STAGING_BASE_URL = "https://staging-api.rdvapp.com/api/"
    const val DEVELOPMENT_BASE_URL = "http://10.0.2.2:4000/api/"
    
    fun getBaseUrl(isDebug: Boolean = true): String {
        return if (isDebug) {
            DEVELOPMENT_BASE_URL
        } else {
            PRODUCTION_BASE_URL
        }
    }
}

// Network result wrapper for handling API responses
sealed class NetworkResult<T> {
    data class Success<T>(val data: T) : NetworkResult<T>()
    data class Error<T>(val message: String, val code: Int? = null) : NetworkResult<T>()
    data class Loading<T>(val isLoading: Boolean = true) : NetworkResult<T>()
}

// Extension function for safe API calls
suspend fun <T> safeApiCall(
    apiCall: suspend () -> retrofit2.Response<T>
): NetworkResult<T> {
    return try {
        val response = apiCall()
        if (response.isSuccessful) {
            response.body()?.let {
                NetworkResult.Success(it)
            } ?: NetworkResult.Error("Empty response body")
        } else {
            NetworkResult.Error(
                message = response.message(),
                code = response.code()
            )
        }
    } catch (e: Exception) {
        NetworkResult.Error(
            message = e.message ?: "Unknown error occurred"
        )
    }
}