import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const FAL_KEY = process.env.FAL_KEY;

export const handler = async (event) => {
    // Enable CORS
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    if (event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const path = event.rawPath || event.path; // Support Function URL or API Gateway
    const method = event.requestContext?.http?.method || event.httpMethod;

    console.log(`Request: ${method} ${path}`);

    try {
        if (path === '/fal/proxy' && method === 'POST') {
            const body = JSON.parse(event.body);
            if (!FAL_KEY) throw new Error("Server configuration error: Missing FAL_KEY");

            // Proxy to FAL (Sync)
            const response = await fetch(`https://fal.run/fal-ai/sam-3/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...body, output_format: "png" })
            });

            if (!response.ok) {
                const text = await response.text();
                return { statusCode: response.status, headers, body: JSON.stringify({ error: text }) };
            }

            const data = await response.json();
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        if (path === '/storage/presigned-put' && method === 'GET') {
            const id = event.queryStringParameters?.id;
            if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };

            const key = `programs/${id}.rsl.json`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                ContentType: 'application/json'
            });

            const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
            const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

            return { statusCode: 200, headers, body: JSON.stringify({ uploadUrl: url, publicUrl, key }) };
        }

        if (path === '/storage/presigned-get' && method === 'GET') {
            const key = event.queryStringParameters?.key;
            if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing key' }) };

            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key
            });

            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            return { statusCode: 200, headers, body: JSON.stringify({ url }) };
        }

        if (path === '/proxy-image' && method === 'GET') {
            const imageUrl = event.queryStringParameters?.url;
            if (!imageUrl) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing url' }) };

            const crypto = await import('node:crypto');
            const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
            const key = `proxy-cache/${hash}`;
            const cloudfrontUrl = `https://d3o8kr3f57bjz6.cloudfront.net/${key}`;

            try {
                await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
                return {
                    statusCode: 302,
                    headers: { ...headers, "Location": cloudfrontUrl },
                    body: ''
                };
            } catch (e) {
                // Not found, proceed
            }

            console.log(`Fetching ${imageUrl} and caching to ${key}`);

            const response = await fetch(imageUrl);
            if (!response.ok) return { statusCode: response.status, headers, body: 'Failed to fetch image' };

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/jpeg';

            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: buffer,
                ContentType: contentType
            }));

            return {
                statusCode: 302,
                headers: { ...headers, "Location": cloudfrontUrl },
                body: ''
            };
        }


        if (path === '/gemini/proxy' && method === 'POST') {
            const GEMINI_KEY = process.env.GEMINI_KEY;
            if (!GEMINI_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server configuration error: Missing GEMINI_KEY' }) };

            let body;
            try {
                body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            } catch (e) {
                console.error("Failed to parse body:", event.body);
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
            }

            console.log("Proxy Request Body Model:", body.model);
            const model = body.model || 'gemini-2.0-flash';
            delete body.model;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) {
                return { statusCode: response.status, headers, body: JSON.stringify(data) };
            }
            return { statusCode: 200, headers, body: JSON.stringify(data) };
        }

        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not Found', path }) };

    } catch (e) {
        console.error(e);
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
