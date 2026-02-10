const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

export async function submitSam3Request(imageUrl: string, prompt: string): Promise<any> {
    try {
        console.log("Submitting to Proxy:", PROXY_URL || "(relative)");

        // Call our Lambda Proxy
        const response = await fetch(`${PROXY_URL}/fal/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl, prompt })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Proxy Error: ${err}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("SAM-3 Error:", error);
        throw error;
    }
}
