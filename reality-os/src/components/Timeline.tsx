import { useStore } from '../store';
import type { Op } from '../types';
// import { ArrowRight } from 'lucide-react';

export function Timeline() {
    const schedule = useStore((state) => state.program.schedule);
    const ops = useStore((state) => state.program.ops);
    const registers = useStore((state) => state.program.registers);
    const wires = useStore((state) => state.program.wires);
    const setHoveredItem = useStore((state) => state.setHoveredItem);

    // Derive schedule from ops if explicit schedule empty (for now, just list ops)
    // In a real app, we'd use the explicit schedule
    const displayOps = schedule.length > 0
        ? schedule.map(item => ops.find(o => o.op_id === item.exec)).filter(Boolean) as Op[]
        : ops;


    return (
        <div className="w-full h-full flex items-center p-4 bg-neutral-900 overflow-x-auto gap-4">
            {displayOps.length === 0 && (
                <div className="text-neutral-500 text-xs italic">
                    Timeline empty.
                </div>
            )}
            {displayOps.map((op, index) => {
                // Find inputs for this op
                const inputs = wires.filter(w => w.target_id === op.op_id).map(w => w.source_id);
                const inputRegs = registers.filter(r => inputs.includes(r.reg_id));
                const inputNames = inputRegs.map(r => r.sym.display_name || "Object").join(", ");

                return (
                    <div key={op.op_id} className="flex items-center">
                        <div
                            className="relative group cursor-pointer"
                            onMouseEnter={() => {
                                // Highlight the op and its inputs
                                setHoveredItem(op.op_id);
                                // Ideally we'd hover multiple, but for now let's hover the Op, 
                                // and RealityView can highlight inputs if the Op is hovered.
                            }}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            {/* Step Circle */}
                            <div className="bg-neutral-800 border-2 border-neutral-700 group-hover:border-purple-500 group-hover:bg-purple-900/20 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold text-neutral-300 transition-colors">
                                {index + 1}
                            </div>

                            {/* Label & Details */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-neutral-300 whitespace-nowrap bg-black/50 px-1 rounded">
                                    {op.type}
                                </span>
                                {inputNames && (
                                    <span className="text-[9px] text-purple-400 whitespace-nowrap mt-0.5">
                                        {inputNames}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Connection Line */}
                        {index < displayOps.length - 1 && (
                            <div className="w-8 h-[2px] bg-neutral-800 mx-2" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
