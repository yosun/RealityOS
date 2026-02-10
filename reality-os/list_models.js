const key = process.env.GEMINI_KEY;
if (!key) {
    console.error("Error: GEMINI_KEY environment variable not set.");
    process.exit(1);
}
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function listModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(m.name);
                }
            });
        } else {
            console.log("Error:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

listModels();
