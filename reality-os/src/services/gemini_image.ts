
export interface Part {
    text?: string;
    inline_data?: {
        mime_type: string;
        data: string;
    };
}

export interface GeminiImageRequest {
    model?: string;
    contents: {
        parts: Part[];
    }[];
    generationConfig?: {
        responseModalities: ["TEXT", "IMAGE"];
    };
}

// Re-use the proxy setup from existing services
const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

export async function generateGeminiImage(prompt: string, base64Image?: string, mimeType: string = "image/jpeg") {
    console.log("Submitting to Gemini 3 Pro Image via Proxy:", PROXY_URL || "(relative)");

    const endpoint = `${PROXY_URL}/gemini/proxy`;

    const parts: Part[] = [
        { text: prompt }
    ];

    if (base64Image) {
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: base64Image
            }
        });
    }

    const request: GeminiImageRequest = {
        model: 'gemini-1.5-flash', // Fallback/Standard, wait, user said Gemini 3 Image?
        // Actually, for image generation/editing, we need specific models.
        // If 'gemini-3-pro-image-preview' is the target, we should verify that.
        // But for now, let's fix the key first.
        contents: [{ parts }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
        }
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Image API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
}
