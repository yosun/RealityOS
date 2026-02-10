import { useStore } from '../store';
import { RealityView } from './RealityView';
import { Canvas2D } from './Canvas2D';
import { SourceOverlay } from './SourceOverlay';
import { ChatInterface } from './ChatInterface';
import { Play, Code } from 'lucide-react';
import clsx from 'clsx';

export function Viewport() {
    const interactionMode = useStore((state) => state.ui.interactionMode);
    const view = useStore((state) => state.ui.view);
    const setInteractionMode = useStore((state) => state.setInteractionMode);
    const imageUrl = useStore((state) => state.program.source.image_url);

    if (!imageUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 border border-dashed border-neutral-800 m-4 rounded bg-neutral-900/50">
                <div className="text-center">
                    <p className="mb-2">No Image Loaded</p>
                    {/* Upload button or similar could go here */}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative group">
            {/* Mode Switching Controls */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-neutral-900/90 backdrop-blur rounded-full border border-neutral-800 p-1 shadow-lg">
                <button
                    onClick={() => setInteractionMode('run')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all",
                        interactionMode === 'run'
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    )}
                >
                    <Play size={12} fill={interactionMode === 'run' ? "currentColor" : "none"} />
                    Run Mode
                </button>
                <button
                    onClick={() => setInteractionMode('source')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all",
                        interactionMode === 'source'
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    )}
                >
                    <Code size={12} />
                    View Source
                </button>
            </div>

            {/* Main View */}
            {view === '3d' ? (
                <RealityView />
            ) : (
                <div className="w-full h-full relative">
                    <Canvas2D />
                    {/* Chat Interface overlay for 2D mode */}
                    <div className="absolute top-4 right-4 w-[400px] h-[calc(100%-2rem)] shadow-2xl pointer-events-none">
                        <div className="w-full h-full pointer-events-auto shadow-2xl rounded-xl overflow-hidden glass-panel">
                            <ChatInterface />
                        </div>
                    </div>
                </div>
            )}

            {/* Overlays */}
            {view === '3d' && <SourceOverlay />}
        </div>
    );
}
