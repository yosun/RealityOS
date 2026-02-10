
export interface Provenance {
    engine: 'sam3' | 'gemini-3' | 'user'; // Added 'user'
    request_id: string;
    mask_index: number;
    score?: number;
    box?: [number, number, number, number]; // x, y, w, h
}

export interface Geometry {
    mask_url?: string; // Made optional
    text_value?: string; // Added for text registers
}

export interface SymbolInfo {
    variable_name: string;
    display_name: string; // user friendly name
    locked: boolean;
    history: string[]; // past names
}

export interface Register {
    reg_id: string; // "R:{request_id}:{mask_index}"
    type: 'image' | 'text' | 'number'; // Added type
    provenance: Provenance;
    geom: Geometry;
    sym: SymbolInfo;
}

export type OpKind = 'transform' | 'composite' | 'filter' | 'analysis' | 'output'; // simplified for now

export interface Op {
    op_id: string;
    type: string;
    params: Record<string, any>;
    position: { x: number; y: number };
    status: 'idle' | 'running' | 'completed' | 'error';
    result: any;
}

export interface Wire {
    edge_id: string;
    source_id: string;
    target_id: string;
    type: 'data' | 'control';
}

export interface ScheduleItem {
    order: number;
    exec: string; // op_id
}

export interface Program {
    id: string;
    source: {
        image_url: string;
    };
    registers: Register[];
    ops: Op[];
    wires: Wire[];
    schedule: ScheduleItem[];
    metadata?: {
        last_saved_url?: string;
        created_at?: string;
        updated_at?: string;
    };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    thought?: string;
    timestamp: number;
}

export interface ChatThread {
    id: string;
    targetId: string | null; // null for global/main chat, string for node/reg id
    messages: ChatMessage[];
    position?: { x: number, y: number, z: number }; // 3D position if attached to node
    isOpen: boolean;
}

export interface UIState {
    interactionMode: 'run' | 'source';
    // 'source' mode can have sub-views like 'inspect', 'refine', etc. 
    // For now we keep the existing 'mode' as 'sourceSubMode' or just use 'mode' for that if we want to keep it simple.
    // Let's rely on 'view' for 2d/3d/split and use 'mode' for the tool selection in source mode.

    // Legacy mode field (now sub-mode for View Source)
    mode: 'inspect' | 'refine' | 'wire' | 'timeline';
    view: '2d' | '3d' | 'split';

    cursor_order: number;
    layer_extrusion: {
        base_z: number;
        z_step: number;
    };
    selected_register_id: string | null;
    selected_op_id: string | null;
    hovered_item_id: string | null; // Added for hover effects
    last_thought: string | null;

    activeChatThreads: ChatThread[];
    mainChatId: string; // ID of the main "pop-out" chat
    aspect_ratio?: number;
}
