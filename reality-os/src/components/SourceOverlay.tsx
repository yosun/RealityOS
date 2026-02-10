import { useStore } from '../store';

export function SourceOverlay() {
    const interactionMode = useStore((state) => state.ui.interactionMode);
    const registers = useStore((state) => state.program.registers);

    if (interactionMode !== 'source') return null;

    return (
        <div className="absolute inset-0 pointer-events-none p-4">
            {/* Overlay UI for Source Mode */}
            <div className="absolute top-4 left-4 pointer-events-auto">
                <div className="bg-neutral-900/80 backdrop-blur border border-neutral-700 rounded p-2 text-xs text-neutral-400">
                    <h3 className="font-bold text-white mb-2">Internal State</h3>
                    <div>Registers: {registers.length}</div>
                    {/* Add more stats or controls here */}
                </div>
            </div>

            {/* In the future, this is where we map 2D screen coordinates of 3D objects to show labels */}
        </div>
    );
}
