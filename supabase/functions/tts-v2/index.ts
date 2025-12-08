import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const VOICE_IDS = {
  workout: '6OzrBCQf8cjERkYgzSg8',
  breathing: '1YBpxMFAafA83t7u1xof',
  amani: '1YBpxMFAafA83t7u1xof',
  default: '1YBpxMFAafA83t7u1xof',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚀 TTS-V2 DEPLOYED - Request method:', req.method)

  let requestBody;
  
  try {
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { text, voice_id, voice_type } = requestBody
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    
    if (!apiKey) {
      console.error('❌ ELEVENLABS_API_KEY not set!')
      return new Response(
        JSON.stringify({ error: 'Voice service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const voiceId = voice_id || VOICE_IDS[voice_type as keyof typeof VOICE_IDS] || VOICE_IDS.default
    console.log(`🎤 TTS: voice_type=${voice_type}, voiceId=${voiceId}, text="${text.substring(0, 50)}..."`)

    const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: voice_type === 'workout' ? 0.3 : 0.4,
          similarity_boost: 0.8,
          style: voice_type === 'workout' ? 0.7 : 0.5,
          use_speaker_boost: true,
        },
      }),
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('❌ ElevenLabs error:', elevenLabsResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'TTS failed', status: elevenLabsResponse.status }), 
        { status: elevenLabsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ ElevenLabs success!')
    const audioArrayBuffer = await elevenLabsResponse.arrayBuffer()

    return new Response(audioArrayBuffer, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})