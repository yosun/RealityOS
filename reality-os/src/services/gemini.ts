export interface GeminiRequest {
    model?: string;
    contents: {
        role: "user" | "model";
        parts: {
            text?: string;
            inline_data?: {
                mime_type: string;
                data: string;
            };
            file_data?: {
                mime_type: string;
                file_uri: string;
            }
        }[];
    }[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: "text/plain" | "application/json";
    };
}

const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

export async function generateContent(request: GeminiRequest) {
    console.log("Submitting to Gemini Proxy:", PROXY_URL || "(relative)");

    // If we are on localhost and VITE_LAMBDA_URL is set, use it.
    // If we are on production (CloudFront), VITE_LAMBDA_URL is empty, so we use relative path.
    const endpoint = `${PROXY_URL}/gemini/proxy`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

/**
 * Processes a user intent against an image using RealityOS/Gemini 3 logic.
 */
export async function processRealityIntent(imageUrl: string, intent: string) {
    const { REALITY_OS_SYSTEM_PROMPT } = await import('../utils/ai_schema');

    const result = await generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
            role: "user",
            parts: [
                { text: REALITY_OS_SYSTEM_PROMPT },
                { text: `User Intent: ${intent}` },
                { text: `Image URL: ${imageUrl}` }
            ]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    // Clean markdown if present
    const cleanJson = text.replace(/```json\n|```/g, '');
    return JSON.parse(cleanJson);
}
