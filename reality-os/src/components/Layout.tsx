import type { ReactNode } from 'react';

interface LayoutProps {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    bottom: ReactNode;
}

export function Layout({ left, center, right, bottom }: LayoutProps) {
    return (
        <div className="flex h-screen w-screen bg-neutral-900 text-neutral-200 overflow-hidden font-mono text-sm">
            {/* Main horizontal split */}
            <div className="flex flex-1 flex-col overflow-hidden">

                {/* Top/Middle section */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Panel: Registers */}
                    <div className="w-64 border-r border-neutral-800 flex flex-col bg-neutral-950">
                        <div className="p-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Registers
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {left}
                        </div>
                    </div>

                    {/* Center Panel: Viewport */}
                    <div className="flex-1 flex flex-col relative bg-neutral-900">
                        <div className="absolute top-2 left-2 z-10">
                            {/* Controls will go here or in component */}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {center}
                        </div>
                    </div>

                    {/* Right Panel: Ops Graph */}
                    <div className="w-80 border-l border-neutral-800 flex flex-col bg-neutral-950">
                        <div className="p-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500">
                            Operations
                        </div>
                        <div className="flex-1 overflow-y-auto relative">
                            {right}
                        </div>
                    </div>
                </div>

                {/* Bottom Panel: Timeline */}
                <div className="h-32 border-t border-neutral-800 flex flex-col bg-neutral-950 relative">
                    <div className="p-2 border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-500 flex justify-between items-center">
                        <span>Timeline</span>
                        <span className="text-[10px] text-neutral-700">{import.meta.env.PACKAGE_VERSION}</span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        {bottom}
                    </div>
                </div>
            </div>
        </div>
    );
}
