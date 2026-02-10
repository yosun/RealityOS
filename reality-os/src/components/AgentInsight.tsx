import { useStore } from '../store';
import { Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentInsight() {
    const lastThought = useStore((state) => state.ui.last_thought);

    if (!lastThought) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
            >
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-950 border-b border-neutral-800 text-purple-400">
                    <Brain size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Agent Insight (Gemini 3 Pro)</span>
                </div>
                <div className="p-3 text-xs text-neutral-300 font-mono leading-relaxed whitespace-pre-wrap">
                    {lastThought}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
