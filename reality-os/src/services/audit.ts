import { v4 as uuidv4 } from 'uuid';

const PROXY_URL = import.meta.env.VITE_LAMBDA_URL === undefined ? "" : import.meta.env.VITE_LAMBDA_URL;

// Generate a session ID for this browser session
const SESSION_ID = uuidv4();

export interface AuditLogEntry {
    action: string;
    target_id?: string | null;
    details?: any;
    metadata?: any;
}

export const AuditService = {
    log: async (action: string, target_id?: string | null, details?: any) => {
        try {
            const payload = {
                action,
                actor_id: SESSION_ID, // Tracking by session for now
                target_id,
                details,
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    version: '0.4.15'
                }
            };

            // Non-blocking fire-and-forget (mostly)
            fetch(`${PROXY_URL}/audit/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error("Audit Log Failed:", err));

        } catch (e) {
            console.error("Audit Log Error:", e);
        }
    }
};
