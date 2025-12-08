import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { text, voice_type } = await req.json();
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const voiceId = voice_type === 'workout' ? '6OzrBCQf8cjERkYgzSg8' : '1YBpxMFAafA83t7u1xof';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: 0.4, similarity_boost: 0.8 } }),
    });

    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
