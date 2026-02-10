import { useState } from 'react';
import { useStore } from '../store';
import { saveProgram } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Cpu, Save, Download } from 'lucide-react';
import { AgentInsight } from './AgentInsight';

export function InputPanel() {
    const imageUrl = useStore((state) => state.program.source.image_url);
    const program = useStore((state) => state.program);
    const setProgram = useStore((state) => state.setProgram);
    const updateUI = useStore((state) => state.updateUI);

    const [urlInput, setUrlInput] = useState('');
    const [intent, setIntent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoadImage = async () => {
        if (!urlInput) return;
        setLoading(true);

        try {
            // Check if sensitive to CORS (simple heuristic)
            const isExternal = urlInput.startsWith('http') && !urlInput.includes('s3.amazonaws.com') && !urlInput.includes('cloudfront.net');
            const lambdaUrl = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

            let finalUrl = urlInput;

            if (isExternal) {
                const proxyUrl = `${lambdaUrl}/proxy-image?url=${encodeURIComponent(urlInput)}`;
                // Fetch to trigger caching and get the final redirected URL
                try {
                    const res = await fetch(proxyUrl);
                    if (res.ok || res.type === 'opaque' || res.redirected) {
                        finalUrl = res.url;
                    } else {
                        console.warn("Proxy returned non-ok status:", res.status);
                        // Fallback to proxy URL if fetch fails for some reason (e.g. CORS on error)
                        finalUrl = proxyUrl;
                    }
                } catch (err) {
                    console.error("Failed to resolve proxy URL:", err);
                    finalUrl = proxyUrl;
                }
            }

            setProgram({
                id: uuidv4(),
                source: { image_url: finalUrl },
                registers: [],
                ops: [],
                wires: [],
                schedule: [],
                metadata: { created_at: new Date().toISOString() }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const url = await saveProgram(program);
            console.log(`Saved! ID: ${program.id}\nLocation: ${url}`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(program, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `realityos-${program.id}.rsl.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const processIntent = useStore((state) => state.processIntent);
    const mainChatId = useStore((state) => state.ui.mainChatId);

    const handleProcess = async () => {
        if (!imageUrl || !intent) return;
        setLoading(true);
        updateUI({ last_thought: null });

        try {
            await processIntent(mainChatId, intent);
        } catch (e) {
            console.error(e);
            updateUI({ last_thought: `Error: ${e instanceof Error ? e.message : String(e)}` });
        } finally {
            setLoading(false);
        }
    };

    if (!imageUrl) {
        return (
            <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex flex-col gap-2">
                <div className="text-xs font-bold text-neutral-500 uppercase">Input Source</div>
                <div className="flex gap-2">
                    <input
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 text-xs"
                        placeholder="Image URL..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadImage()}
                    />
                    <button
                        className="bg-blue-600 text-white rounded px-3 py-1 text-xs flex items-center gap-1 hover:bg-blue-500"
                        onClick={handleLoadImage}
                    >
                        <Upload size={12} /> Load
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex flex-col gap-2">
            <div className="text-xs font-bold text-neutral-500 uppercase flex justify-between items-center">
                Intent
                <div className="flex gap-1">
                    <button title="Save" onClick={handleSave} className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded"><Save size={14} /></button>
                    <button title="Export" onClick={handleExport} className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded"><Download size={14} /></button>
                </div>
            </div>
            <div className="flex gap-2">
                <input
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 text-xs"
                    placeholder="e.g. 'segment the cat'"
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                    disabled={loading}
                />
                <button
                    className="bg-purple-600 text-white rounded px-3 py-1 text-xs flex items-center gap-1 hover:bg-purple-500 disabled:opacity-50"
                    onClick={handleProcess}
                    disabled={loading}
                >
                    <Cpu size={12} /> {loading ? '...' : 'Run'}
                </button>
            </div>
            {/* Agent Insight Panel */}
            <AgentInsight />
        </div>
    );
}
