import { useRef } from 'react';
import { useStore } from '../store';
import clsx from 'clsx';
import type { Register } from '../types';

export function Canvas2D() {
    const imageUrl = useStore((state) => state.program.source.image_url);
    const registers = useStore((state) => state.program.registers);
    const selectedRegId = useStore((state) => state.ui.selected_register_id);
    const updateUI = useStore((state) => state.updateUI);

    const containerRef = useRef<HTMLDivElement>(null);

    // Measure image to set generic aspect ratio container?
    // Or just rely on img behavior.

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-dots" ref={containerRef}>
            <div className="relative shadow-2xl border border-neutral-800 bg-neutral-950">
                <img
                    src={imageUrl}
                    className="max-w-full max-h-[80vh] block object-contain select-none"
                    draggable={false}
                />

                {/* Overlay Masks */}
                {registers.map((reg) => (
                    <MaskOverlay
                        key={reg.reg_id}
                        register={reg}
                        isSelected={selectedRegId === reg.reg_id}
                        onSelect={() => updateUI({ selected_register_id: reg.reg_id })}
                    />
                ))}
            </div>
        </div>
    );
}

function MaskOverlay({ register, isSelected, onSelect }: { register: Register, isSelected: boolean, onSelect: () => void }) {
    // We assume mask_url is a transparent PNG where the mask is white/opaque and rest is transparent
    // Or it might be a binary mask.
    // If we want to colorize it, we can use CSS filter or SVG.
    // CSS filter: drop-shadow, or just opacity.

    // For selection, we might want to highlight borders.

    return (
        <div
            className={clsx(
                "absolute inset-0 transition-opacity duration-200 pointer-events-auto cursor-pointer",
                isSelected ? "opacity-60 z-10" : "opacity-0 hover:opacity-30"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <img
                src={register.geom.mask_url}
                className={clsx(
                    "w-full h-full object-contain",
                    // Use hue-rotate or filters to distinguish?
                )}
                style={{
                    filter: isSelected ? 'drop-shadow(0 0 2px cyan)' : undefined
                }}
            />
            {isSelected && (
                <div className="absolute inset-0 border-2 border-cyan-500/50 pointer-events-none" />
            )}
        </div>
    )
}
