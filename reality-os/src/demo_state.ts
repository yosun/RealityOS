import type { Program } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

export const demoProgram: Program = {
    id: uuidv4(),
    source: {
        image_url: '/messy_desk.png',
    },
    registers: [
        {
            reg_id: 'R:CABLES',
            geom: { mask_url: 'https://placehold.co/1024x1024/png?text=Mask:Cables&font=roboto' }, // Placeholder mask
            sym: { display_name: 'Messy Cables', variable_name: 'cables', locked: false, history: [] },
            provenance: { engine: 'sam3', request_id: 'demo', mask_index: 0 }
        },
        {
            reg_id: 'R:LAPTOP',
            geom: { mask_url: 'https://placehold.co/1024x1024/png?text=Mask:Laptop&font=roboto' },
            sym: { display_name: 'Laptop', variable_name: 'laptop', locked: false, history: [] },
            provenance: { engine: 'sam3', request_id: 'demo', mask_index: 1 }
        },
        {
            reg_id: 'R:WALLS',
            geom: { mask_url: 'https://placehold.co/1024x1024/png?text=Mask:Walls&font=roboto' },
            sym: { display_name: 'Walls', variable_name: 'walls', locked: false, history: [] },
            provenance: { engine: 'sam3', request_id: 'demo', mask_index: 2 }
        }
    ],
    ops: [
        {
            op_id: 'OP:REMOVE',
            type: 'inpaint', // "Remove"
            params: { prompt: 'remove cables' },
            position: { x: 2, y: 0 },
            status: 'completed',
            result: null
        },
        {
            op_id: 'OP:STYLE',
            type: 'style',
            params: { prompt: 'cyberpunk neon grid' },
            position: { x: 2, y: -1.5 },
            status: 'completed',
            result: null
        },
        {
            op_id: 'OP:GLOW',
            type: 'style',
            params: { prompt: 'blue glow', strength: 0.8 },
            position: { x: 2, y: 1.5 },
            status: 'completed',
            result: null
        }
    ],
    wires: [
        { edge_id: 'W:1', source_id: 'R:CABLES', target_id: 'OP:REMOVE', type: 'data' },
        { edge_id: 'W:2', source_id: 'R:WALLS', target_id: 'OP:STYLE', type: 'data' },
        { edge_id: 'W:3', source_id: 'R:LAPTOP', target_id: 'OP:GLOW', type: 'data' }
    ],
    schedule: [
        { order: 0, exec: 'OP:REMOVE' },
        { order: 1, exec: 'OP:STYLE' },
        { order: 2, exec: 'OP:GLOW' }
    ],
    metadata: {
        created_at: new Date().toISOString()
    }
};
