async function testGemini() {
    const url = 'https://d3o8kr3f57bjz6.cloudfront.net/gemini/proxy';

    // Note: The Lambda proxy now overrides the model to 'gemini-3-pro-preview' if not specified, 
    // or we can pass it explicitly.
    const body = {
        model: 'gemini-3-pro-preview',
        contents: [{
            parts: [{ text: 'Hello, please output a JSON with a "thought" field explaining your reasoning, and a "program" field.' }]
        }]
    };

    try {
        console.log("Sending request to:", url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text.substring(0, 2000)); // Print first 2000 chars

    } catch (e) {
        console.error("Error:", e);
    }
}

testGemini();
