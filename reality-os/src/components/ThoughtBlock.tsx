import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface ThoughtBlockProps {
    thought: string;
}

export function ThoughtBlock({ thought }: ThoughtBlockProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="my-2 border border-purple-500/30 bg-purple-900/10 rounded-lg overflow-hidden font-sans">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-2 text-xs font-medium text-purple-300 hover:bg-purple-900/20 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Brain size={14} className="text-purple-400" />
                    <span>Thought Signature</span>
                </div>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 pt-0"
                    >
                        <p className="text-xs text-purple-200/80 leading-relaxed font-mono whitespace-pre-wrap">
                            {thought}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
