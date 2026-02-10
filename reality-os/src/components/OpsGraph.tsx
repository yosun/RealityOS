import { useStore } from '../store';
import { Plus, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Op } from '../types';

export function OpsGraph() {
    const ops = useStore((state) => state.program.ops);
    const registers = useStore((state) => state.program.registers);
    const addOp = useStore((state) => state.addOp);

    const handleAddOp = () => {
        const newOp: Op = {
            op_id: uuidv4(),
            type: 'transform',
            params: {},
            position: { x: 0, y: 0 },
            status: 'idle',
            result: null
        };
        addOp(newOp);
    };

    return (
        <div className="flex flex-col h-full bg-neutral-900 text-xs">
            <div className="p-2 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
                <span className="font-semibold text-neutral-400">Operations</span>
                <button onClick={handleAddOp} className="p-1 hover:bg-neutral-800 rounded text-green-500">
                    <Plus size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {ops.length === 0 && (
                    <div className="text-neutral-600 italic text-center py-4">
                        No operations.
                    </div>
                )}
                {ops.map(op => (
                    <OpItem key={op.op_id} op={op} registers={registers} />
                ))}
            </div>
        </div>
    );
}

function OpItem({ op, registers }: { op: Op, registers: any[] }) {
    const wires = useStore((state) => state.program.wires);

    // Find inputs/outputs from wires
    const inputs = wires.filter(w => w.target_id === op.op_id).map(w => w.source_id);
    // const outputs = wires.filter(w => w.source_id === op.op_id).map(w => w.target_id);
    // Note regarding outputs: Wires in our new schema seem to go Register -> Op.
    // If Op outputs to Register, we need a wire Op -> Register.
    // The previous code assumed reads/writes on Op.
    // Let's just visualize what we have for now.

    const inputRegisters = registers.filter(r => inputs.includes(r.reg_id));
    // For outputs, if we had Op->Reg wires, we'd find them. 
    // But currently our Gemini parser only created Reg->Op wires (inputs).
    // Let's assume outputs are implicit or not yet wired for this visualization.

    return (
        <div className="border border-neutral-700 bg-neutral-950 rounded p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-300 w-full">
                    {op.type || "Unnamed Op"}
                </span>
                <span className="bg-neutral-900 text-neutral-500 text-[10px] px-1 rounded border border-neutral-800 ml-2">
                    {op.status}
                </span>
            </div>

            {/* IO Section */}
            <div className="flex items-center gap-1">
                {/* Inputs */}
                <div className="flex-1">
                    <div className="text-[10px] text-neutral-500 mb-1">Inputs</div>
                    <div className="flex flex-col gap-1">
                        {inputRegisters.map((reg, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-neutral-900 p-1 rounded text-[10px]">
                                <span className="truncate flex-1">{reg.sym.display_name || reg.sym.variable_name}</span>
                            </div>
                        ))}
                        {inputRegisters.length === 0 && <div className="text-[10px] text-neutral-600 italic">None</div>}
                    </div>
                </div>

                <div className="text-neutral-600">
                    <ArrowRight size={12} />
                </div>

                {/* Outputs */}
                <div className="flex-1">
                    <div className="text-[10px] text-neutral-500 mb-1">Outputs</div>
                    <div className="text-[10px] text-neutral-600 italic">--</div>
                </div>
            </div>
        </div>
    )
}
