import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { ThoughtBlock } from './ThoughtBlock';

export function ChatInterface() {
    const mainChatId = useStore((state) => state.ui.mainChatId);
    const activeThreads = useStore((state) => state.ui.activeChatThreads);
    const addChatMessage = useStore((state) => state.addChatMessage);
    const toggleChatThread = useStore((state) => state.toggleChatThread);

    // Find main thread
    const mainThread = activeThreads.find(t => t.id === mainChatId);
    const isOpen = mainThread?.isOpen ?? false;

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mainThread?.messages]);

    const handleSend = () => {
        if (!input.trim() || !mainChatId) return;

        addChatMessage(mainChatId, {
            role: 'user',
            content: input,
        });
        setInput('');

        // Simulate AI response for now
        setTimeout(() => {
            addChatMessage(mainChatId, {
                role: 'assistant',
                content: `I received: "${input}". (This is a mock response)`,
            });
        }, 1000);
    };

    if (!mainThread) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[60vh]"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
                            <span className="font-semibold text-neutral-200 text-sm flex items-center gap-2">
                                <MessageSquare size={14} className="text-purple-400" />
                                Reality Chat
                            </span>
                            <button
                                onClick={() => toggleChatThread(mainChatId, false)}
                                className="text-neutral-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {mainThread.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    {msg.thought && (
                                        <div className="max-w-[95%]">
                                            <ThoughtBlock thought={msg.thought} />
                                        </div>
                                    )}
                                    {msg.content && (
                                        <div
                                            className={`
                                            max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                                            ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-neutral-800 text-neutral-200 rounded-bl-none border border-neutral-700'
                                                }
                                        `}
                                        >
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-neutral-700 bg-neutral-800/30">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask to change something..."
                                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600"
                                />
                                <button
                                    onClick={handleSend}
                                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!input.trim()}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Re-open button if closed */}
            {!isOpen && (
                <div className="absolute bottom-6 right-6 pointer-events-auto">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleChatThread(mainChatId, true)}
                        className="bg-blue-600 p-4 rounded-full text-white shadow-lg shadow-blue-900/20"
                    >
                        <MessageSquare size={24} />
                    </motion.button>
                </div>
            )}
        </div>
    );
}
