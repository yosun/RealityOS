import { create } from 'zustand';
import type { Program, Register, Op, Wire, UIState, ChatMessage } from './types.ts';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from './services/audit';

interface AppState {
    program: Program;
    ui: UIState;

    // Actions
    setProgram: (program: Program) => void;
    updateUI: (updates: Partial<UIState>) => void;
    setHoveredItem: (id: string | null) => void;
    updateSourceImage: (url: string) => void;

    // RSL Actions
    addRegister: (reg: Register) => void;
    updateRegister: (regId: string, updates: Partial<Register>) => void;
    addOp: (op: Op) => void;
    updateOp: (opId: string, updates: Partial<Op>) => void;
    addWire: (wire: Wire) => void;
    removeWire: (edgeId: string) => void;
    reorderSchedule: (startIndex: number, endIndex: number) => void;

    // Chat Actions
    addChatMessage: (threadId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    setInteractionMode: (mode: 'run' | 'source') => void;
    toggleChatThread: (threadId: string, isOpen: boolean) => void;

    // Async Actions
    processIntent: (threadId: string, intent: string) => Promise<void>;
    executeProgram: (threadId: string) => Promise<void>;
}

const initialProgram: Program = {
    id: uuidv4(),
    source: {
        image_url: '',
    },
    registers: [],
    ops: [],
    wires: [],
    schedule: [],
    metadata: {
        created_at: new Date().toISOString()
    }
};

const mainChatId = uuidv4();

const initialUI: UIState = {
    interactionMode: 'source',
    mode: 'inspect',
    view: '3d', // Default to 3d for the "wow" factor
    cursor_order: 0,
    layer_extrusion: {
        base_z: 0.1,
        z_step: 0.5,
    },
    selected_register_id: null,
    selected_op_id: null,
    hovered_item_id: null, // Added
    last_thought: null,
    mainChatId,
    activeChatThreads: [
        {
            id: mainChatId,
            targetId: null,
            messages: [
                { id: uuidv4(), role: 'assistant', content: 'What would you like to do with this Reality Object?', timestamp: Date.now() }
            ],
            isOpen: true
        }
    ],
    aspect_ratio: undefined,
};

export const useStore = create<AppState>((set) => ({
    program: initialProgram,
    ui: initialUI,

    setProgram: (program) => set({ program }),

    updateUI: (updates) => set((state) => ({ ui: { ...state.ui, ...updates } })),
    setHoveredItem: (id) => set((state) => ({ ui: { ...state.ui, hovered_item_id: id } })), // Implemented
    updateSourceImage: (url) => set((state) => ({
        program: { ...state.program, source: { ...state.program.source, image_url: url } }
    })), // Implemented

    // RSL Actions
    addRegister: (reg) => {
        AuditService.log('ADD_REGISTER', reg.reg_id, { title: reg.sym?.display_name, provenance: reg.provenance });
        set((state) => ({
            program: { ...state.program, registers: [...state.program.registers, reg] }
        }));
    },

    updateRegister: (regId, updates) => {
        // AuditService.log('UPDATE_REGISTER', regId, updates);
        set((state) => ({
            program: {
                ...state.program,
                registers: state.program.registers.map((r) =>
                    r.reg_id === regId ? { ...r, ...updates } : r
                ),
            }
        }));
    },

    addOp: (op) => {
        AuditService.log('ADD_OP', op.op_id, { type: op.type });
        set((state) => {
            const newOps = [...state.program.ops, op];
            return {
                program: {
                    ...state.program,
                    ops: newOps,
                    schedule: [...state.program.schedule, { order: state.program.schedule.length, exec: op.op_id }]
                }
            };
        });
    },

    updateOp: (opId, updates) => set((state) => ({
        program: {
            ...state.program,
            ops: state.program.ops.map((o) =>
                o.op_id === opId ? { ...o, ...updates } : o
            ),
        }
    })),

    addWire: (wire) => {
        AuditService.log('ADD_WIRE', wire.edge_id, { source: wire.source_id, target: wire.target_id });
        set((state) => {
            const newWires = [...state.program.wires, wire];
            return { program: { ...state.program, wires: newWires } };
        });
    },

    removeWire: (edgeId) => set((state) => ({
        program: { ...state.program, wires: state.program.wires.filter(w => w.edge_id !== edgeId) }
    })),

    reorderSchedule: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.program.schedule);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return {
            program: {
                ...state.program,
                schedule: result.map((item, index) => ({ ...item, order: index }))
            }
        };
    }),

    // Chat Actions
    addChatMessage: (threadId, message) => set((state) => ({
        ui: {
            ...state.ui,
            activeChatThreads: state.ui.activeChatThreads.map((t) =>
                t.id === threadId
                    ? {
                        ...t,
                        messages: [
                            ...t.messages,
                            {
                                id: uuidv4(),
                                timestamp: Date.now(),
                                ...message,
                            },
                        ],
                    }
                    : t
            ),
        },
    })),

    setInteractionMode: (mode) => set((state) => ({
        ui: {
            ...state.ui,
            interactionMode: mode,
            view: mode === 'run' ? '2d' : '3d' // Auto-switch view
        }
    })),

    toggleChatThread: (threadId, isOpen) => set((state) => ({
        ui: {
            ...state.ui,
            activeChatThreads: state.ui.activeChatThreads.map((t) =>
                t.id === threadId ? { ...t, isOpen } : t
            ),
        },
    })),

    processIntent: async (threadId, intent) => {
        // 1. Add User Message
        useStore.getState().addChatMessage(threadId, { role: 'user', content: intent });

        // 2. Add Thinking Placeholder
        useStore.getState().addChatMessage(threadId, { role: 'assistant', content: '🤔 Thinking...' });
        useStore.getState().updateUI({ last_thought: 'Thinking...' });

        try {
            // Dynamic import to avoid circular dependency if valid
            const { processRealityIntent } = await import('./services/gemini');

            const imageUrl = useStore.getState().program.source.image_url;
            const result = await processRealityIntent(imageUrl, intent);

            // Update Thinking Message and Agent Insight
            useStore.setState((prev) => ({
                ui: {
                    ...prev.ui,
                    last_thought: result.thought, // Populate Agent Insight
                    activeChatThreads: prev.ui.activeChatThreads.map(t =>
                        t.id === threadId ? {
                            ...t,
                            messages: t.messages.map(m =>
                                m.content === '🤔 Thinking...' ? { ...m, content: '', thought: result.thought } : m
                            ),
                        } : t
                    )
                }
            }));

            // 1. Update Registers
            const registerMap = new Map<string, string>();
            if (result.program.registers) {
                // Create all registers first (empty/loading state)
                for (const reg of result.program.registers) {
                    const regId = `R:${uuidv4().slice(0, 8)}`;
                    registerMap.set(reg.id, regId);

                    useStore.getState().addRegister({
                        reg_id: regId,
                        type: reg.type || 'image', // Default to image if undefined
                        geom: {
                            // For image types, we might default to parent image? 
                            // Or empty if it's a segmentation output. 
                            // Let's leave it empty for now, Op will fill it.
                            mask_url: reg.value || undefined
                        },
                        sym: {
                            display_name: reg.title || 'Object',
                            variable_name: reg.title || 'var',
                            locked: false,
                            history: []
                        },
                        provenance: { engine: 'user', request_id: 'init', mask_index: 0 }
                    });
                }
            }

            // 2. Process Ops & Wires
            if (result.program.ops) {
                result.program.ops.forEach((op: any) => {
                    const opId = `OP:${uuidv4().slice(0, 8)}`;

                    // Hack: Map outputs to register UUIDs for execution
                    // We store this in params so executeProgram can find it.
                    // If op has 'output' list of IDs, we map them.
                    let targetRegId = null;
                    if (op.output && op.output.length > 0) {
                        targetRegId = registerMap.get(op.output[0]);
                    }

                    useStore.getState().addOp({
                        op_id: opId,
                        type: op.type,
                        params: { ...op.params, target_register_id: targetRegId },
                        position: { x: 0, y: 0 },
                        status: 'idle',
                        result: null
                    });

                    // Add Wires (Input -> Op)
                    if (op.input) {
                        op.input.forEach((inputId: string) => {
                            const sourceRegId = registerMap.get(inputId);
                            if (sourceRegId) {
                                useStore.getState().addWire({
                                    edge_id: `W:${uuidv4().slice(0, 8)}`,
                                    source_id: sourceRegId,
                                    target_id: opId,
                                    type: 'data'
                                });
                            }
                        });
                    }
                });
            }

            // 3. Trigger Execution
            useStore.getState().executeProgram(threadId);


        } catch (e) {
            console.error(e);
            useStore.getState().addChatMessage(threadId, {
                role: 'assistant',
                content: "Error connecting to Reality OS Core."
            });
        }
    },

    executeProgram: async (threadId) => {
        const state = useStore.getState();
        const { schedule, ops } = state.program;

        // Helper: Find Input Registers for an Op
        const getInputRegisters = (opId: string) => {
            const inputs = state.program.wires.filter(w => w.target_id === opId).map(w => w.source_id);
            return state.program.registers.filter(r => inputs.includes(r.reg_id));
        };

        for (const step of schedule) {
            const op = ops.find(o => o.op_id === step.exec);
            if (!op) continue;

            // Update Status: Running
            useStore.getState().updateOp(op.op_id, { status: 'running' });

            try {
                // Dynamic Imports
                const { submitSam3Request } = await import('./services/fal');
                const { generateGeminiImage } = await import('./services/gemini_image');
                const { urlToBase64 } = await import('./utils/image_utils');
                const { generateContent } = await import('./services/gemini');

                // 1. Segmentation
                if (op.type === 'segmentation') {
                    // Inputs: Source Image(s)
                    const inputs = getInputRegisters(op.op_id);
                    const sourceReg = inputs.find(r => r.type === 'image' || r.geom.mask_url);

                    if (sourceReg) {
                        // Determine Prompt: Explicit param > Target Register Title > "object"
                        let prompt = op.params?.prompt;
                        if (!prompt && op.params?.target_register_id) {
                            const targetReg = state.program.registers.find(r => r.reg_id === op.params.target_register_id);
                            if (targetReg) prompt = targetReg.sym.display_name;
                        }
                        prompt = prompt || "object";

                        useStore.getState().addChatMessage(threadId, { role: 'assistant', content: `Segmenting ${prompt}...` });

                        const imageUrl = sourceReg.geom.mask_url || useStore.getState().program.source.image_url;
                        const samResult = await submitSam3Request(imageUrl, prompt);

                        if (samResult && samResult.image && samResult.image.url) {
                            const maskUrl = samResult.image.url;
                            const proxyUrl = (url: string) => {
                                const baseUrl = import.meta.env.VITE_LAMBDA_URL || "";
                                if (!url) return "";
                                if (url.startsWith("data:")) return url;
                                return `${baseUrl}/proxy-image?url=${encodeURIComponent(url)}`;
                            };
                            const proxied = proxyUrl(maskUrl);

                            // Update Op Result
                            useStore.getState().updateOp(op.op_id, {
                                result: { mask_url: proxied },
                                status: 'completed'
                            });

                            // Update Target Register
                            if (op.params?.target_register_id) {
                                useStore.getState().updateRegister(op.params.target_register_id, {
                                    geom: { mask_url: proxied }
                                });
                            }
                        } else {
                            throw new Error("No mask returned from SAM3");
                        }
                    } else {
                        throw new Error("No source image for segmentation");
                    }
                }

                // 2. Style
                else if (op.type === 'style') {
                    const inputs = getInputRegisters(op.op_id);
                    const sourceReg = inputs.find(r => r.geom.mask_url || r.type === 'image'); // Prefer mask

                    if (sourceReg) {
                        const maskUrl = sourceReg.geom.mask_url || useStore.getState().program.source.image_url;
                        const prompt = `Edit this image: ${op.params.color || 'styled'} ${op.params.prompt || ''}`;

                        useStore.getState().addChatMessage(threadId, { role: 'assistant', content: `Styling ${sourceReg.sym.display_name}...` });

                        const base64 = await urlToBase64(maskUrl);
                        const result = await generateGeminiImage(prompt, base64);

                        if (result.candidates?.[0]?.content?.parts?.[0]?.inline_data) {
                            const img = result.candidates[0].content.parts[0].inline_data;
                            const dataUrl = `data:${img.mime_type};base64,${img.data}`;

                            useStore.getState().updateOp(op.op_id, {
                                result: { image_url: dataUrl },
                                status: 'completed'
                            });

                            // Visual Update on Register (Source or Target?)
                            // Styles usually modify the register in place or create a new one. 
                            // If target_register_id is set, use that. Else update source.
                            const targetId = op.params?.target_register_id || sourceReg.reg_id;

                            useStore.getState().updateRegister(targetId, {
                                geom: { mask_url: dataUrl },
                                // Update name if likely valid
                                sym: {
                                    ...useStore.getState().program.registers.find(r => r.reg_id === targetId)?.sym,
                                    display_name: `${op.params.color || 'Styled'} ${useStore.getState().program.registers.find(r => r.reg_id === targetId)?.sym.display_name}`
                                } as any
                            });
                        }
                    }
                }

                // 3. LLM (Text)
                else if (op.type === 'llm') {
                    const inputs = getInputRegisters(op.op_id);
                    // Context from inputs?
                    const context = inputs.map(r => `${r.sym.display_name}: ${r.type}`).join(', ');
                    const prompt = op.params?.prompt || `Analyze these objects: ${context}`;

                    useStore.getState().addChatMessage(threadId, { role: 'assistant', content: `Analyzing: ${prompt}...` });

                    // Call Gemini Text
                    const result = await generateContent({
                        model: 'gemini-1.5-flash', // Standard model
                        contents: [{ role: "user", parts: [{ text: prompt }] }]
                    });

                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis.";

                    useStore.getState().updateOp(op.op_id, { status: 'completed', result: { text } });

                    // Update Target Register if exists
                    if (op.params?.target_register_id) {
                        useStore.getState().updateRegister(op.params.target_register_id, {
                            type: 'text',
                            geom: { text_value: text } // Using the new optional field
                        });
                    }
                }

                // Default
                else {
                    useStore.getState().updateOp(op.op_id, { status: 'completed' });
                }

            } catch (e) {
                console.error(`Op ${op.op_id} failed:`, e);
                useStore.getState().updateOp(op.op_id, { status: 'error', result: { error: String(e) } });
            }
        }

        useStore.getState().addChatMessage(threadId, { role: 'assistant', content: "Execution complete." });
    }
}));
