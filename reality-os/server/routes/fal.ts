import { Router } from 'express';
// import { fal } from '@fal-ai/serverless-client'; // We might use fetch directly or the client if it supports server-side
import { config } from '../config';

export const falRouter = Router();

// Proxy for FAL
// Client sends: { image_url, prompt }
// We send to FAL using FAL_KEY
// We return the result

falRouter.post('/proxy', async (req, res) => {
    try {
        const { image_url, prompt } = req.body;

        if (!config.falKey) {
            return res.status(500).json({ error: 'FAL_KEY not configured on server' });
        }

        // Using standard fetch to FAL queue
        const response = await fetch(`https://queue.fal.run/fal-ai/sam-3/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${config.falKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image_url,
                prompt,
                return_multiple_masks: true,
                max_masks: 4,
                include_boxes: true,
                include_scores: true
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`FAL API Error: ${err}`);
        }

        const data = await response.json();
        // With queue, we might get a request_id and need to poll.
        // fal-ai/sam-3/image is usually fast but might be queued.
        // If we use the raw HTTP API, we have to handle queuing.
        // The @fal-ai/serverless-client handles this on the client.
        // Since we are building a "proxy", maybe we should let the client use the library,
        // but proxy the specific calls?
        // OR we use the library here on the server and return the final result.

        // Let's use the library on the server if possible, or just simple fetch if it waits.
        // For SAM-3, it's often fast.

        return res.json(data);

    } catch (error: any) {
        console.error('FAL Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});
