package com.rdvapp.presentation

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.firebase.messaging.FirebaseMessaging
import com.rdvapp.presentation.auth.AuthViewModel
import com.rdvapp.presentation.auth.LoginScreen
import com.rdvapp.presentation.auth.RegisterScreen
import com.rdvapp.presentation.navigation.BottomNavigation
import com.rdvapp.ui.theme.RDVAppTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    private val authViewModel: AuthViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        
        // Keep splash screen visible while checking auth state
        splashScreen.setKeepOnScreenCondition {
            authViewModel.uiState.isLoading
        }
        
        // Initialize Firebase Messaging
        initializeFirebaseMessaging()
        
        setContent {
            RDVAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RDVApp(
                        authViewModel = authViewModel,
                        intent = intent
                    )
                }
            }
        }
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
    }
    
    private fun initializeFirebaseMessaging() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                android.util.Log.w("FCM", "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }
            
            // Get new FCM registration token
            val token = task.result
            android.util.Log.d("FCM", "FCM Registration Token: $token")
            
            // Send token to server when user is authenticated
            authViewModel.updateFCMToken(token)
        }
    }
}

@Composable
fun RDVApp(
    authViewModel: AuthViewModel,
    intent: Intent? = null
) {
    val navController = rememberNavController()
    val authUiState = authViewModel.uiState
    
    // Handle deep links and navigation based on auth state
    LaunchedEffect(authUiState.isAuthenticated, authUiState.isLoading) {
        if (!authUiState.isLoading) {
            if (authUiState.isAuthenticated) {
                navController.navigate("main") {
                    popUpTo("auth") { inclusive = true }
                }
            } else {
                navController.navigate("auth") {
                    popUpTo("main") { inclusive = true }
                }
            }
        }
    }
    
    // Handle notification navigation
    LaunchedEffect(intent) {
        if (authUiState.isAuthenticated && intent != null) {
            val navigateTo = intent.getStringExtra("navigate_to")
            val messageId = intent.getStringExtra("message_id")
            val appointmentId = intent.getStringExtra("appointment_id")
            
            when (navigateTo) {
                "messages" -> {
                    navController.navigate("main") {
                        popUpTo("auth") { inclusive = true }
                    }
                    // Additional navigation to messages tab handled in BottomNavigation
                }
                "appointments", "schedule" -> {
                    navController.navigate("main") {
                        popUpTo("auth") { inclusive = true }
                    }
                    // Additional navigation to schedule tab handled in BottomNavigation
                }
            }
        }
    }
    
    NavHost(
        navController = navController,
        startDestination = if (authUiState.isLoading) "splash" else if (authUiState.isAuthenticated) "main" else "auth"
    ) {
        // Splash/Loading screen
        composable("splash") {
            // Empty composable - splash screen handles the loading state
        }
        
        // Authentication flow
        composable("auth") {
            AuthFlow(authViewModel = authViewModel)
        }
        
        // Main app flow
        composable("main") {
            BottomNavigation(
                authViewModel = authViewModel,
                intent = intent
            )
        }
    }
}

@Composable
fun AuthFlow(authViewModel: AuthViewModel) {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") {
            LoginScreen(
                onNavigateToRegister = {
                    navController.navigate("register")
                },
                onLoginSuccess = {
                    // Navigation is handled by the parent RDVApp composable
                },
                viewModel = authViewModel
            )
        }
        
        composable("register") {
            RegisterScreen(
                onNavigateToLogin = {
                    navController.navigate("login") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onRegisterSuccess = {
                    // Navigation is handled by the parent RDVApp composable
                },
                viewModel = authViewModel
            )
        }
    }
}