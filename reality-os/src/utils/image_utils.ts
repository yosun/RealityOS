export async function urlToBase64(url: string): Promise<string> {
    try {
        // If it's already a data URL, return it (but strip prefix if raw bytes are needed, 
        // though Gemini usually handles data URIs or base64 strings differently. 
        // Docs say 'data' field in inline_data is base64 string).
        if (url.startsWith("data:")) {
            return url.split(",")[1];
        }

        const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

        // Use proxy if needed to avoid CORS
        const fetchUrl = url.startsWith("http") && PROXY_URL
            ? `${PROXY_URL}/proxy-image?url=${encodeURIComponent(url)}`
            : url;

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // Remove the "data:image/jpeg;base64," part
                resolve(base64data.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error converting URL to Base64:", e);
        throw e;
    }
}
