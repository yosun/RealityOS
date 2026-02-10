import dotenv from 'dotenv';
import path from 'path';

// Load from .agent/.credentials if we are in dev mode and it exists, 
// otherwise rely on standard .env or system env vars.
// For this repo structure, .agent is at ../.agent relative to project root?
// The user provided standard .env vars in the Task 156.
// Let's assume standard dotenv flow for now, pointing to a local .env if present.

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    falKey: process.env.FAL_KEY,
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.S3_BUCKET_NAME
    }
};

if (!config.falKey) {
    console.warn("Warning: FAL_KEY is not set. FAL integration will fail.");
}

if (!config.aws.accessKeyId || !config.aws.secretAccessKey || !config.aws.s3Bucket) {
    console.warn("Warning: AWS credentials not fully set. S3 storage will fail.");
}
