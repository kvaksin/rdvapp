package com.rdvapp.presentation.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.rdvapp.presentation.auth.AuthViewModel
import com.rdvapp.presentation.messages.MessagesScreen
import com.rdvapp.presentation.profile.ProfileScreen
import com.rdvapp.presentation.schedule.ScheduleScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomNavigation(
    authViewModel: AuthViewModel,
    intent: android.content.Intent? = null
) {
    val navController = rememberNavController()
    
    // Handle notification navigation
    LaunchedEffect(intent) {
        intent?.let {
            val navigateTo = it.getStringExtra("navigate_to")
            when (navigateTo) {
                "messages" -> navController.navigate("messages")
                "appointments", "schedule" -> navController.navigate("schedule")
                "profile" -> navController.navigate("profile")
            }
        }
    }
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                
                bottomNavItems.forEach { item ->
                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.title
                            )
                        },
                        label = { Text(item.title) },
                        selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                        onClick = {
                            navController.navigate(item.route) {
                                // Pop up to the start destination of the graph to
                                // avoid building up a large stack of destinations
                                // on the back stack as users select items
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                // Avoid multiple copies of the same destination when
                                // reselecting the same item
                                launchSingleTop = true
                                // Restore state when reselecting a previously selected item
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "schedule",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("schedule") {
                ScheduleScreen(authViewModel = authViewModel)
            }
            
            composable("messages") {
                MessagesScreen(authViewModel = authViewModel)
            }
            
            composable("profile") {
                ProfileScreen(authViewModel = authViewModel)
            }
        }
    }
}

data class BottomNavItem(
    val title: String,
    val icon: ImageVector,
    val route: String
)

private val bottomNavItems = listOf(
    BottomNavItem(
        title = "Schedule",
        icon = Icons.Default.Schedule,
        route = "schedule"
    ),
    BottomNavItem(
        title = "Messages",
        icon = Icons.Default.Message,
        route = "messages"
    ),
    BottomNavItem(
        title = "Profile",
        icon = Icons.Default.Person,
        route = "profile"
    )
)