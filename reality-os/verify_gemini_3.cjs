const https = require('https');

// Configuration
const ENDPOINT = 'https://d3o8kr3f57bjz6.cloudfront.net/gemini/proxy';
const MODEL = 'gemini-3-pro-preview';
const IMAGE_URL = 'https://aimagical.com/is/pixelsquid/Cartoon%20House.H03.2k.png';
const INTENT = 'Make the windows turn pink when tapped';

// System Prompt (Simplified for test)
const SYSTEM_PROMPT = `
You are the "Intent Engine" for RealityOS.
Analyze the user's intent and image to generate a "thought" and a "program".
Output JSON only.
`;

const payload = {
    model: MODEL,
    contents: [{
        role: "user",
        parts: [
            { text: SYSTEM_PROMPT },
            { text: `User Intent: ${INTENT}` },
            { text: `Image URL: ${IMAGE_URL}` }
        ]
    }]
};

function verify() {
    console.log(`🚀 Starting Verification for ${MODEL}...`);
    console.log(`   Endpoint: ${ENDPOINT}`);
    console.log(`   Image: ${IMAGE_URL}`);
    console.log(`   Intent: "${INTENT}"`);

    const req = https.request(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, (res) => {
        let data = '';
        console.log(`\n📡 Response Status: ${res.statusCode}`);

        res.on('data', (chunk) => data += chunk);

        res.on('end', () => {
            try {
                if (res.statusCode !== 200) {
                    console.error('❌ Failed! Server returned:', data);
                    return;
                }

                const json = JSON.parse(data);

                // Gemini Response Structure
                const candidates = json.candidates;
                if (!candidates || candidates.length === 0) {
                    console.error('❌ No candidates returned:', json);
                    return;
                }

                const content = candidates[0].content.parts[0].text;
                console.log('\n📝 Raw Content Length:', content.length);

                // Try to parse the inner JSON (Gemini usually returns markdown block ```json ... ```)
                let cleanJson = content.replace(/```json\n|```/g, '');
                const result = JSON.parse(cleanJson);

                console.log('\n🔍 verification Results:');

                if (result.thought) {
                    console.log('   ✅ Thought Signature Present');
                    console.log('      Excerpt:', result.thought.substring(0, 100) + '...');
                } else {
                    console.error('   ❌ Missing "thought" field');
                }

                if (result.program && result.program.registers) {
                    console.log('   ✅ Program Generated');
                    console.log('      Registers:', result.program.registers.length);
                } else {
                    console.error('   ❌ Missing "program" or "registers"');
                }

                console.log('\n✨ Integration Verified!');

            } catch (e) {
                console.error('\n❌ Error parsing response:', e);
                console.log('   Raw Data:', data.substring(0, 500));
            }
        });
    });

    req.on('error', (e) => {
        console.error(`\n❌ Request Error: ${e.message}`);
    });

    req.write(JSON.stringify(payload));
    req.end();
}

verify();
