import { useStore } from '../store';
import { Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';
import type { Register } from '../types';

export function RegisterList() {
    const registers = useStore((state) => state.program.registers);
    const selectedRegId = useStore((state) => state.ui.selected_register_id);
    const updateUI = useStore((state) => state.updateUI);
    const updateRegister = useStore((state) => state.updateRegister);

    return (
        <div className="flex flex-col gap-1 p-2">
            {registers.length === 0 && (
                <div className="p-4 text-neutral-500 italic text-center text-xs">
                    No registers. <br /> Upload an image to start.
                </div>
            )}
            {registers.map((reg) => (
                <RegisterItem
                    key={reg.reg_id}
                    register={reg}
                    isSelected={selectedRegId === reg.reg_id}
                    onSelect={() => updateUI({ selected_register_id: reg.reg_id })}
                    onUpdate={(updates) => updateRegister(reg.reg_id, updates)}
                />
            ))}
        </div>
    );
}

function RegisterItem({
    register,
    isSelected,
    onSelect,
    onUpdate
}: {
    register: Register;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<Register>) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(register.sym.display_name || register.sym.variable_name);

    const handleRename = () => {
        if (isEditing) {
            if (editName.trim()) {
                onUpdate({
                    sym: {
                        ...register.sym,
                        display_name: editName.trim()
                    }
                });
            }
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    };

    return (
        <div
            className={clsx(
                "flex items-center gap-2 p-2 rounded cursor-pointer border",
                isSelected
                    ? "bg-blue-900/30 border-blue-700 text-blue-100"
                    : "bg-neutral-900 border-transparent hover:bg-neutral-800 text-neutral-300"
            )}
            onClick={onSelect}
        >
            <div
                className="w-8 h-8 bg-neutral-950 border border-neutral-800 rounded flex-shrink-0 relative overflow-hidden"
            >
                <img
                    src={register.geom.mask_url}
                    className="w-full h-full object-cover opacity-50"
                    alt="mask"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono opacity-50">
                    {register.provenance.mask_index}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded px-1 text-xs focus:outline-none focus:border-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div
                        className="text-xs font-medium truncate"
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!register.sym.locked) setIsEditing(true);
                        }}
                    >
                        {register.sym.display_name || register.sym.variable_name || "Unnamed"}
                    </div>
                )}
                <div className="text-[10px] text-neutral-500 font-mono truncate">
                    {register.reg_id}
                </div>
            </div>

            <button
                className={clsx(
                    "p-1 rounded hover:bg-neutral-700",
                    register.sym.locked ? "text-amber-500" : "text-neutral-600"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ sym: { ...register.sym, locked: !register.sym.locked } });
                }}
            >
                {register.sym.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
        </div>
    );
}
