import UIKit
import Capacitor
import UserNotifications
import Firebase
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Initialize Firebase
        FirebaseApp.configure()
        print("✅ Firebase configured")
        
        // Set Firebase Messaging delegate
        Messaging.messaging().delegate = self
        
        // IMPORTANT: Set delegate AFTER Capacitor initializes
        // We'll set it in applicationDidBecomeActive to ensure it's after Capacitor setup
        
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("✅ Notification permission granted")
                // Register for remote notifications
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                    print("✅ Registered for remote notifications")
                }
            } else {
                print("❌ Notification permission denied")
            }
            if let error = error {
                print("❌ Error requesting notification permission: \(error)")
            }
        }
        
        return true
    }
    
    // MARK: - Firebase Messaging Delegate
    
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("🔥 Firebase FCM Token: \(fcmToken ?? "nil")")
        
        // Store the token to send to your server
        if let token = fcmToken {
            // Post notification so the app can save this token
            NotificationCenter.default.post(
                name: NSNotification.Name("FCMToken"),
                object: nil,
                userInfo: ["token": token]
            )
            
            // Also store in UserDefaults for JavaScript to access
            UserDefaults.standard.set(token, forKey: "fcmToken")
            UserDefaults.standard.synchronize()
            print("✅ FCM Token stored in UserDefaults")
            
            // Inject token into WebView localStorage so JavaScript can access it
            // Use a longer delay to ensure WebView is fully loaded
            DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                self.injectFCMTokenToWebView(token: token)
            }
            // Also retry at 10 seconds in case the first attempt fails
            DispatchQueue.main.asyncAfter(deadline: .now() + 10.0) {
                self.injectFCMTokenToWebView(token: token)
            }
        }
    }
    
    // Inject notification tap timestamp to prevent duplicate local notifications
    private func injectNotificationTapTimestamp() {
        guard let webView = (window?.rootViewController as? CAPBridgeViewController)?.webView else {
            print("⚠️ WebView not available for tap timestamp injection")
            return
        }
        
        let timestamp = Int64(Date().timeIntervalSince1970 * 1000)
        let js = """
            localStorage.setItem('lastNotificationTap', '\(timestamp)');
            localStorage.setItem('lastPushReceived', '\(timestamp)');
            console.log('📱 iOS: Notification tap timestamp set: \(timestamp)');
        """
        
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("❌ Error injecting tap timestamp: \(error)")
            } else {
                print("✅ Notification tap timestamp injected")
            }
        }
    }
    
    // Inject FCM token into WebView localStorage
    private func injectFCMTokenToWebView(token: String) {
        guard let webView = (window?.rootViewController as? CAPBridgeViewController)?.webView else {
            print("⚠️ WebView not available for FCM token injection")
            return
        }
        
        let js = """
            localStorage.setItem('ios_fcm_token', '\(token)');
            console.log('📱 iOS FCM token injected into localStorage');
            window.dispatchEvent(new CustomEvent('fcm-token-received', { detail: { token: '\(token)' } }));
        """
        
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("❌ Error injecting FCM token to WebView: \(error)")
            } else {
                print("✅ FCM Token injected to WebView localStorage")
            }
        }
    }
    
    // Inject navigation command into WebView for deep linking
    private func injectNavigationToWebView(view: String, topicId: String?, replyId: String?) {
        guard let webView = (window?.rootViewController as? CAPBridgeViewController)?.webView else {
            print("⚠️ WebView not available for navigation injection")
            return
        }
        
        let topicIdJs = topicId != nil ? "'\(topicId!)'" : "null"
        let replyIdJs = replyId != nil ? "'\(replyId!)'" : "null"
        
        let js = """
            console.log('📱 iOS: Injecting navigation to \(view)');
            localStorage.setItem('pendingDeepLink', JSON.stringify({
                view: '\(view)',
                topicId: \(topicIdJs),
                replyId: \(replyIdJs),
                timestamp: Date.now()
            }));
            window.dispatchEvent(new CustomEvent('notification-navigation', { 
                detail: { view: '\(view)', topicId: \(topicIdJs), replyId: \(replyIdJs) } 
            }));
            console.log('📱 iOS: Navigation event dispatched');
        """
        
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("❌ Error injecting navigation to WebView: \(error)")
            } else {
                print("✅ Navigation injected to WebView: \(view)")
            }
        }
    }
    
    // MARK: - Remote Notification Registration
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        print("✅ Registered for remote notifications with device token")
        Messaging.messaging().apnsToken = deviceToken
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("❌ Failed to register for remote notifications: \(error)")
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Set delegate here to ensure it's after Capacitor initialization
        // This ensures our delegate handles notifications even if Capacitor sets one
        UNUserNotificationCenter.current().delegate = self
        print("✅ Notification delegate set in applicationDidBecomeActive")
        
        // Try to inject FCM token when app becomes active (WebView should be ready)
        if let fcmToken = UserDefaults.standard.string(forKey: "fcmToken") {
            print("📱 App became active, attempting FCM token injection...")
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.injectFCMTokenToWebView(token: fcmToken)
            }
        }
        
        // Also check for pending navigation from notification tap
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            self.checkAndInjectPendingNavigation()
        }
    }
    
    // Check UserDefaults for pending navigation and inject into WebView
    private func checkAndInjectPendingNavigation() {
        guard let pendingNav = UserDefaults.standard.string(forKey: "pendingNavigation"),
              pendingNav == "discussions" else {
            return
        }
        
        let topicId = UserDefaults.standard.string(forKey: "pendingTopicId")
        let replyId = UserDefaults.standard.string(forKey: "pendingReplyId")
        
        if let topicId = topicId {
            print("📱 Found pending navigation in UserDefaults: discussions, topicId: \(topicId)")
            
            // Clear the pending navigation
            UserDefaults.standard.removeObject(forKey: "pendingNavigation")
            UserDefaults.standard.removeObject(forKey: "pendingTopicId")
            UserDefaults.standard.removeObject(forKey: "pendingReplyId")
            UserDefaults.standard.synchronize()
            
            // Inject into WebView
            self.injectNavigationToWebView(view: "discussions", topicId: topicId, replyId: replyId)
        }
    }
    
    // Handle notifications when app is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        print("📱 AppDelegate: Notification received in foreground")
        print("📱 Notification title: \(notification.request.content.title)")
        print("📱 Notification body: \(notification.request.content.body)")
        
        // Show notification even when app is in foreground
        if #available(iOS 14.0, *) {
            print("✅ Showing notification with banner (iOS 14+)")
            completionHandler([.banner, .sound, .badge])
        } else {
            print("✅ Showing notification with alert (iOS < 14)")
            completionHandler([.alert, .sound, .badge])
        }
    }
    
    // Handle notification tap
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        let notificationContent = response.notification.request.content
        print("📱 ========== NOTIFICATION TAPPED (AppDelegate) ==========")
        print("📱 Notification tapped - userInfo: \(userInfo)")
        print("📱 Notification title: \(notificationContent.title)")
        print("📱 Notification body: \(notificationContent.body)")
        
        // Immediately inject lastNotificationTap to prevent duplicate local notifications
        // Inject multiple times to ensure it's set before JS runs
        for delay in [0.0, 0.3, 0.8, 1.5] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.injectNotificationTapTimestamp()
            }
        }
        
        // Extract notification type from userInfo (check multiple possible keys)
        var notificationType: String? = nil
        
        // Check various possible locations for the type
        if let type = userInfo["type"] as? String {
            notificationType = type
        } else if let capExtra = userInfo["cap_extra"] as? [String: Any], let type = capExtra["type"] as? String {
            // Capacitor wraps extra data in cap_extra
            notificationType = type
        } else if let extra = userInfo["extra"] as? [String: Any], let type = extra["type"] as? String {
            notificationType = type
        } else if let data = userInfo["data"] as? [String: Any], let type = data["type"] as? String {
            notificationType = type
        } else if notificationContent.title.lowercased().contains("mentioned you") {
            // Fallback: detect mention from title
            notificationType = "mention"
        } else if notificationContent.title.lowercased().contains("checking in") || 
                  notificationContent.body.lowercased().contains("check in") {
            notificationType = "checkin"
        }
        
        print("📱 Notification type detected: \(notificationType ?? "unknown")")
        
        // Handle different notification types
        switch notificationType {
        case "checkin":
            print("📱 ✅ CHECK-IN NOTIFICATION - Triggering navigation")
            UserDefaults.standard.set("checkin", forKey: "pendingNavigation")
            UserDefaults.standard.synchronize()
            
        case "mention", "reply", "discussion":
            print("📱 ✅ MENTION/REPLY NOTIFICATION - Triggering navigation to discussions")
            UserDefaults.standard.set("discussions", forKey: "pendingNavigation")
            
            // Extract BOTH topicId and replyId first
            let topicId = userInfo["topic_id"] as? String ?? 
               userInfo["topicId"] as? String ??
               (userInfo["cap_extra"] as? [String: Any])?["topic_id"] as? String ??
               (userInfo["cap_extra"] as? [String: Any])?["topicId"] as? String ??
               (userInfo["data"] as? [String: Any])?["topic_id"] as? String ??
               (userInfo["data"] as? [String: Any])?["topicId"] as? String ??
               (userInfo["extra"] as? [String: Any])?["topic_id"] as? String
            
            let replyId = userInfo["reply_id"] as? String ??
               userInfo["replyId"] as? String ??
               (userInfo["cap_extra"] as? [String: Any])?["reply_id"] as? String ??
               (userInfo["cap_extra"] as? [String: Any])?["replyId"] as? String ??
               (userInfo["data"] as? [String: Any])?["reply_id"] as? String ??
               (userInfo["data"] as? [String: Any])?["replyId"] as? String ??
               (userInfo["extra"] as? [String: Any])?["reply_id"] as? String
            
            // Store both IDs for deep linking
            if let topicId = topicId {
                UserDefaults.standard.set(topicId, forKey: "pendingTopicId")
                print("📱 Stored topicId: \(topicId)")
            }
            if let replyId = replyId {
                UserDefaults.standard.set(replyId, forKey: "pendingReplyId")
                print("📱 Stored replyId: \(replyId)")
            }
            UserDefaults.standard.synchronize()
            
            // Inject into WebView once after WebView is ready - WITH REPLY ID
            if let topicId = topicId {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    // Only inject if still pending (not yet handled by JS)
                    if UserDefaults.standard.string(forKey: "pendingTopicId") != nil {
                        self.injectNavigationToWebView(view: "discussions", topicId: topicId, replyId: replyId)
                        // Clear immediately after injection
                        UserDefaults.standard.removeObject(forKey: "pendingNavigation")
                        UserDefaults.standard.removeObject(forKey: "pendingTopicId")
                        UserDefaults.standard.removeObject(forKey: "pendingReplyId")
                        UserDefaults.standard.synchronize()
                    }
                }
            }
            
        default:
            print("📱 ⚠️ Unknown notification type: \(notificationType ?? "nil")")
            // Default to home
            UserDefaults.standard.set("home", forKey: "pendingNavigation")
            UserDefaults.standard.synchronize()
        }
        
        // Post notification for JavaScript to handle
        NotificationCenter.default.post(
            name: NSNotification.Name("NavigateFromNotification"),
            object: nil,
            userInfo: ["view": notificationType ?? "home"]
        )
        print("📱 Posted NavigateFromNotification")
        
        completionHandler()
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    // Moved to above - setting delegate here

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
