package com.mindbrother.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MainActivity";
    private static final String CHANNEL_ID = "mind-brother-notifications";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel();
        }
        
        setupEdgeToEdge();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d(TAG, "Creating notification channel: " + CHANNEL_ID);
            
            CharSequence name = "Mind Brother";
            String description = "Daily motivation and check-ins";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.setShowBadge(true);
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#4F46E5"));
            channel.enableVibration(true);
            
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
                Log.d(TAG, "Channel created with IMPORTANCE_HIGH");
                
                NotificationChannel created = notificationManager.getNotificationChannel(CHANNEL_ID);
                if (created != null) {
                    Log.d(TAG, "Channel verified - Importance: " + created.getImportance());
                } else {
                    Log.e(TAG, "Channel creation failed!");
                }
            } else {
                Log.e(TAG, "NotificationManager is null!");
            }
        }
    }
    
    private void setupEdgeToEdge() {
        Window window = getWindow();
        
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
            window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        }
        
        View rootView = window.getDecorView().getRootView();
        
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, windowInsets) -> {
            WindowInsetsCompat insets = windowInsets;
            
            androidx.core.graphics.Insets systemBars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
            );
            
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            
            return WindowInsetsCompat.CONSUMED;
        });
        
        WindowInsetsControllerCompat windowInsetsController = 
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (windowInsetsController != null) {
            windowInsetsController.setAppearanceLightStatusBars(false);
            windowInsetsController.setAppearanceLightNavigationBars(false);
        }
    }
}
