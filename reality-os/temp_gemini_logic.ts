export const GEMINI_LOGIC = `    const handleProcess = async () => {
        if (!imageUrl || !intent) return;
        setLoading(true);
        try {
            console.log("Processing Intent with Gemini...");
            
            const { generateContent } = await import('../services/gemini');
            const { REALITY_OS_SYSTEM_PROMPT } = await import('../utils/ai_schema');

            const result = await generateContent({
                model: 'gemini-2.0-flash-exp', 
                contents: [{
                    role: "user",
                    parts: [
                        { text: REALITY_OS_SYSTEM_PROMPT },
                        { text: \`User Intent: \${intent}\` },
                        { text: \`Image URL: \${imageUrl}\` }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });

            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No response from Gemini");

            const responseJson = JSON.parse(text);
            console.log("Parsed RealityOS Program:", responseJson);

            if (responseJson.thought) {
                console.info("🧠 AI Thought:", responseJson.thought);
                alert(\`AI Insight: \${responseJson.thought}\`);
            }

            if (responseJson.program && responseJson.program.registers) {
                responseJson.program.registers.forEach((reg: any) => {
                    const regId = \`R:\${uuidv4().slice(0, 8)}\`;
                    addRegister({
                        reg_id: regId,
                        provenance: { 
                            engine: 'gemini-3', 
                            request_id: 'unknown',
                            mask_index: 0 
                        },
                        geom: { mask_url: reg.value },
                        sym: {
                            variable_name: reg.title || 'var',
                            display_name: reg.title || 'New Register',
                            locked: false,
                            history: []
                        }
                    });
                });
            }

        } catch (e) {
            console.error(e);
            alert(\`Failed to process intent: \${e instanceof Error ? e.message : String(e)}\`);
        } finally {
            setLoading(false);
        }
    };`;
