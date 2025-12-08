import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Unique identifier to verify deployment worked
  const deploymentTimestamp = '2024-12-04T-CURSOR-TEST'
  const uniqueCode = 'MINDBROTHER-DEPLOY-VERIFY-ABC123'
  
  console.log(`🧪 DEPLOYMENT TEST FUNCTION EXECUTED - ${uniqueCode}`)
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Deployment test function is working!',
      deployment_code: uniqueCode,
      deployed_at: deploymentTimestamp,
      request_method: req.method,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
})


