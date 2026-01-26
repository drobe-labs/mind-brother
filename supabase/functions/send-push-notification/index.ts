import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Firebase Cloud Messaging API endpoint
const FCM_API_URL = "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, title, body, data } = await req.json() as PushNotificationRequest;

    console.log("📱 ============ PUSH NOTIFICATION REQUEST ============");
    console.log("📱 User ID:", user_id);
    console.log("📱 Title:", title);
    console.log("📱 Body:", body);
    console.log("📱 Data:", JSON.stringify(data));

    // Get user's push token from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("user_profiles")
      .select("push_token")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      console.error("❌ Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile?.push_token) {
      console.log("⚠️ User has no push token registered");
      return new Response(
        JSON.stringify({ error: "No push token for user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("📱 Push token found:", profile.push_token.substring(0, 30) + "...");
    console.log("📱 Token type:", profile.push_token.includes(":") ? "FCM (Android/iOS)" : "APNs (old)");

    // Get Firebase service account key from environment
    const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY");
    
    if (!firebaseServiceAccount) {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firebase not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the service account key
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(firebaseServiceAccount);
      console.log("📱 Service account parsed successfully");
      console.log("📱 Project ID:", serviceAccount.project_id);
      console.log("📱 Client email:", serviceAccount.client_email);
      console.log("📱 Private key exists:", !!serviceAccount.private_key);
      console.log("📱 Private key starts with:", serviceAccount.private_key?.substring(0, 30));
    } catch (parseError) {
      console.error("❌ Failed to parse service account JSON:", parseError);
      console.log("📱 Raw secret length:", firebaseServiceAccount.length);
      console.log("📱 Raw secret start:", firebaseServiceAccount.substring(0, 50));
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get an access token for FCM (with retry)
    let accessToken: string;
    try {
      accessToken = await getFirebaseAccessToken(serviceAccount);
      if (!accessToken) {
        throw new Error("Access token is null or undefined");
      }
      console.log("📱 Got Firebase access token:", accessToken.substring(0, 20) + "...");
    } catch (tokenError) {
      console.error("❌ First token attempt failed:", tokenError);
      // Retry once
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        accessToken = await getFirebaseAccessToken(serviceAccount);
        if (!accessToken) {
          throw new Error("Access token is null on retry");
        }
        console.log("📱 Got Firebase access token on retry");
      } catch (retryError) {
        console.error("❌ Token retry also failed:", retryError);
        return new Response(
          JSON.stringify({ error: "Failed to get Firebase access token", details: String(retryError) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Ensure all data values are strings (FCM requirement)
    const stringData: Record<string, string> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        stringData[key] = String(value);
      }
    }

    // Build FCM message with click_action for navigation
    const fcmMessage = {
      message: {
        token: profile.push_token,
        notification: {
          title,
          body,
        },
        data: stringData,
        android: {
          priority: "high",
          notification: {
            sound: "default",
            channelId: "mind-brother-notifications",
          },
          data: stringData,
        },
        apns: {
          headers: {
            "apns-priority": "10",
            "apns-push-type": "alert",
          },
          payload: {
            aps: {
              alert: {
                title: title,
                body: body,
              },
              sound: "default",
              badge: 1,
            },
            // Include data at the top level of payload for iOS
            ...stringData,
          },
        },
      },
    };

    console.log("📱 FCM Message:", JSON.stringify(fcmMessage, null, 2));
    
    // Send to FCM
    const fcmUrl = FCM_API_URL.replace("YOUR_PROJECT_ID", serviceAccount.project_id);
    console.log("📱 Sending to FCM URL:", fcmUrl);
    
    const authHeader = `Bearer ${accessToken}`;
    console.log("📱 Auth header length:", authHeader.length);
    console.log("📱 Auth header preview:", authHeader.substring(0, 50) + "...");
    
    const fcmResponse = await fetch(fcmUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fcmMessage),
    });
    
    console.log("📱 FCM Response status:", fcmResponse.status);

    if (!fcmResponse.ok) {
      const errorText = await fcmResponse.text();
      console.error("❌ FCM error:", errorText);
      return new Response(
        JSON.stringify({ error: "FCM delivery failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcmResult = await fcmResponse.json();
    console.log("✅ Push notification sent successfully:", fcmResult);

    return new Response(
      JSON.stringify({ success: true, message_id: fcmResult.name }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Get Firebase access token using service account
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  console.log("🔐 Starting token generation for:", serviceAccount.client_email);
  
  const now = Math.floor(Date.now() / 1000);
  
  // Create JWT header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // Create JWT claims
  const claims = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  // Encode header and claims
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  // Create signing input
  const signingInput = `${encodedHeader}.${encodedClaims}`;

  // Sign with private key
  const privateKey = serviceAccount.private_key;
  if (!privateKey) {
    throw new Error("Private key is missing from service account");
  }
  
  console.log("🔐 Importing private key...");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBinary(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  console.log("🔐 Signing JWT...");
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${encodedSignature}`;

  // Exchange JWT for access token
  console.log("🔐 Exchanging JWT for access token...");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  
  if (tokenData.error) {
    console.error("❌ Token exchange error:", tokenData.error, tokenData.error_description);
    throw new Error(`Token exchange failed: ${tokenData.error} - ${tokenData.error_description}`);
  }
  
  if (!tokenData.access_token) {
    console.error("❌ No access token in response:", JSON.stringify(tokenData));
    throw new Error("No access token in response");
  }
  
  console.log("🔐 Token obtained successfully");
  return tokenData.access_token;
}

// Convert PEM to binary for crypto.subtle
function pemToBinary(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

