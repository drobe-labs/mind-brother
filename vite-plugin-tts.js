// vite-plugin-tts.js
// Place this file in your project root (same folder as vite.config.ts)

export default function ttsPlugin() {
  return {
    name: 'vite-plugin-tts',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle POST requests to /api/text-to-speech
        if (req.method === 'POST' && req.url === '/api/text-to-speech') {
          console.log('🔊 TTS request received');
          
          let body = '';
          
          // Read request body
          req.on('data', chunk => {
            body += chunk.toString();
          });
          
          req.on('end', async () => {
            try {
              const { text, voice_id } = JSON.parse(body);
              console.log('📢 Generating speech for:', text);
              
              // Your ElevenLabs API key
              const ELEVENLABS_API_KEY = 'sk_85ae187f71bc155c7cd7547332b42edfadcdfbbf6acb34d1';
              const voiceId = voice_id || '1YBpxMFAafA83t7u1xof';
              
              // Call ElevenLabs API
              const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                  method: 'POST',
                  headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY
                  },
                  body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: {
                      stability: 0.5,
                      similarity_boost: 0.8
                    }
                  })
                }
              );
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ ElevenLabs error:', response.status, errorText);
                res.writeHead(response.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'TTS service error', details: errorText }));
                return;
              }
              
              // Get audio data
              const audioBuffer = await response.arrayBuffer();
              console.log('✅ Audio generated:', audioBuffer.byteLength, 'bytes');
              
              // Send audio response
              res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength,
                'Cache-Control': 'public, max-age=3600'
              });
              res.end(Buffer.from(audioBuffer));
              
            } catch (error) {
              console.error('❌ TTS error:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
          });
          
        } else {
          // Pass to next middleware
          next();
        }
      });
    }
  };
}
