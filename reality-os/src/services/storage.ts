import type { Program } from '../types';

const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;


export async function saveProgram(program: Program): Promise<string> {
    try {

        // 1. Get Presigned PUT URL from Lambda
        const res = await fetch(`${PROXY_URL}/storage/presigned-put?id=${program.id}`);
        if (!res.ok) throw new Error("Failed to get presigned URL");

        const { uploadUrl, publicUrl } = await res.json();

        // 2. Upload to S3
        const upload = await fetch(uploadUrl, {
            method: 'PUT',
            body: JSON.stringify(program),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!upload.ok) throw new Error("Failed to upload to S3");

        return publicUrl;
    } catch (e) {
        console.error("S3 Save Error:", e);
        // Fallback
        const key = `realityos:program:${program.id}`;
        localStorage.setItem(key, JSON.stringify(program));
        return `local://${program.id}`;
    }
}

export async function loadProgram(id: string): Promise<Program | null> {
    try {
        // 2. Or get Presigned GET URL (safer if bucket becomes private)
        const res = await fetch(`${PROXY_URL}/storage/presigned-get?key=programs/${id}.rsl.json`);
        if (res.ok) {
            const { url } = await res.json();
            const dataRes = await fetch(url);
            if (dataRes.ok) return await dataRes.json();
        }
    } catch (e) {
        console.warn("Failed to load from S3, trying local...", e);
    }

    // Fallback
    const key = `realityos:program:${id}`;
    const data = localStorage.getItem(key);
    if (data) {
        return JSON.parse(data) as Program;
    }
    return null;
}

export async function listPrograms(): Promise<{ id: string }[]> {
    const recents = JSON.parse(localStorage.getItem('realityos:recents') || '[]');
    return recents.map((id: string) => ({ id }));
}
