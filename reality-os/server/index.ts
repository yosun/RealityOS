import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { falRouter } from './routes/fal';
import { s3Router } from './routes/s3';

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from React app
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// API Routes
app.use('/api/fal', falRouter);
app.use('/api/storage', s3Router);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing, return all requests to React app
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
}


// Start server
app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
