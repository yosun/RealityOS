import { Router } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export const s3Router = Router();

const s3 = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId || '',
        secretAccessKey: config.aws.secretAccessKey || ''
    }
});

// GET /api/storage/presigned-put
// Returns a presigned URL for uploading a file
s3Router.get('/presigned-put', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Missing id' });
        }

        const key = `programs/${id}.rsl.json`;
        const command = new PutObjectCommand({
            Bucket: config.aws.s3Bucket,
            Key: key,
            ContentType: 'application/json'
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        // Also return the public URL (assuming bucket is public or we have a getter)
        // If private, we need a presigned GET
        const publicUrl = `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;

        res.json({ uploadUrl: url, publicUrl, key });
    } catch (error: any) {
        console.error('S3 Presigned PUT Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/storage/presigned-get
s3Router.get('/presigned-get', async (req, res) => {
    try {
        const { key } = req.query;
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Missing key' });
        }

        const command = new GetObjectCommand({
            Bucket: config.aws.s3Bucket,
            Key: key
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.json({ url });
    } catch (error: any) {
        console.error('S3 Presigned GET Error:', error);
        res.status(500).json({ error: error.message });
    }
});
