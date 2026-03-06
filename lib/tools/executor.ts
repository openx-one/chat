/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { toolRegistry } from "./registry";
import { StreamChunk } from "@/lib/ai/router";
import { IntentNormalizer } from "@/lib/core/intent/normalizer";
import { Planner } from "@/lib/core/runtime/planner";
import { Policy } from "@/lib/core/runtime/policy";

/**
 * The Brain 🧠
 * Handles the "Tool Call -> Execute -> Recursion" loop.
 * This replaces the duplicate logic in every adapter.
 */
export class ToolExecutor {
    constructor(
        private adapterId: string,
        // We use 'any' for the stream/reader to allow flexibility (ReadableStream vs DefaultReader)
        // different providers (mistral, openai) return different stream objects.
        private fetchStreamFn: (messages: any[], apiKey: string, context?: any) => Promise<any>,
        private processStreamFn: (stream: any) => AsyncGenerator<StreamChunk>
    ) {}

    /**
     * Process potential tool calls from the model's output stream.
     * If tool calls are detected, it executes them, updates history, and recurses (calls model again).
     * @param toolCallBuffer The accumulated tool call from the previous stream chunks
     * @param currentMessages The conversation history up to this point
     * @param apiKey API key for recursion
     */
    async *executeToolCall(
        toolCallBuffer: any,
        formattedMessages: any[],
        sanitizedMessages: any[],
        apiKey: string,
        context?: any
    ): AsyncGenerator<StreamChunk> {
        if (!toolCallBuffer) return;

        // Validate and Normalize the Tool Call
        const normalized = IntentNormalizer.normalizeToolCall(toolCallBuffer);
        
        if (normalized.type === 'error') {
            console.error(`[Executor] Normalization Failed for tool call: ${normalized.reason}`);
            // In a robust system, we might yield a text chunk saying "I tried to call a tool but failed."
            // For now, we return, which stops tool execution but keeps the stream alive if there's text.
            return;
        }

        const toolName = normalized.tool;
        const args = normalized.args;
        const callId = normalized.id;
        
        console.log(`[Executor] Executing Normalized Tool: ${toolName} (ID: ${callId})`);
        
        // We need to inject this into the history if it wasn't already (usually the adapter pushed a partial one)
        // But the safest way is to assume the adapter pushed the *text* content, and now we push the *tool_calls*.
        // A cleaner way: The adapter handles the *stream*, and when it detects end of tool call, it calls us.
        // We construct the "Assistant Tool Call" message here.

        const assistantMsg = {
            role: "assistant",
            content: "", // Use empty string instead of null for broader compatibility
            tool_calls: [{
                id: callId,
                type: "function",
                function: { name: toolName, arguments: toolCallBuffer.function.arguments }
            }]
        };

        // Sync both history arrays (Safety check: don't double-push if they are the same reference)
        formattedMessages.push(assistantMsg);
        if (sanitizedMessages !== formattedMessages) {
            sanitizedMessages.push(assistantMsg);
        }

        // Get dynamic friendly label for tool
        let friendlyLabel = "";
        const toolLabelMap: Record<string, (args: any) => string> = {
            'web_search': () => "Searching Internet",
            'get_weather': (args) => `Checking weather in ${args.city || "requested city"}...`,
            'get_stock': (args) => `Checking price of ${args.symbol || "requested asset"}...`,
            'read_url': (args) => {
                try {
                    return `Reading webpage ${new URL(args.url).hostname}...`;
                } catch {
                    return "Reading webpage...";
                }
            },
            'gmail_action': () => "Calling Gmail Agent...",
            'youtube_action': () => "Calling YouTube Agent...",
        };

        const labelFn = toolLabelMap[toolName];
        if (labelFn) {
            friendlyLabel = labelFn(args);
        } else {
            const baseName = toolName.split('_')[0] || toolName;
            friendlyLabel = `Calling ${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Agent...`;
        }

        // Yield the consolidated tool call to the client (so UI knows we are "calling X")
        yield { 
            type: "tool_call", 
            tool_call: { 
                id: callId,
                function: { name: toolName, arguments: toolCallBuffer.function.arguments },
                type: "function"
            },
            thought: friendlyLabel
        };

        // ------------ MCP CONSENT CHECK ------------
        // Check if this tool belongs to an MCP integration that requires consent
        // Wrapp in block to scope variables and allow safe imports
        {
            const { sessionMCPStore } = await import("@/lib/store/session-mcp-store");
            const { integrationsStore } = await import("@/lib/store/integrations-store");
            const { INTEGRATIONS } = await import("@/lib/integrations");
            const { chatStore } = await import("@/lib/store/chat-store");
            
            // List of known MCP tool patterns (integration_name → tool prefixes)
            const mcpPatterns: Record<string, string[]> = {
                'gmail': ['gmail_', 'read_recent_emails', 'search_emails', 'create_draft', 'send_email'],
                'youtube': ['youtube_'],
                'sheets': ['sheets_', 'google_sheets'],
                'drive': ['drive_', 'google_drive'],
                'slack': ['slack_'],
                'notion': ['notion_'],
                'github': ['github_'],
            };
            
            // Check if tool matches any MCP pattern
            let matchedIntegration: string | null = null;
            for (const [integration, patterns] of Object.entries(mcpPatterns)) {
                if (patterns.some(p => toolName.toLowerCase().startsWith(p) || toolName.toLowerCase().includes(p))) {
                    matchedIntegration = integration;
                    break;
                }
            }
            
            // If this is an MCP tool, check consent
            if (matchedIntegration) {
                const integrationId = matchedIntegration.toLowerCase();
                const isConnected = integrationsStore.isConnected(integrationId) || 
                                   integrationsStore.isConnected(matchedIntegration.toUpperCase());
                const isEnabled = sessionMCPStore.isEnabled(integrationId);
                
                // Find integration info for display
                const integrationInfo = INTEGRATIONS.find(
                    i => i.id.toLowerCase() === integrationId || i.name.toLowerCase() === integrationId
                );
                
                const info = {
                    id: integrationId,
                    name: integrationInfo?.name || matchedIntegration.charAt(0).toUpperCase() + matchedIntegration.slice(1),
                    icon: typeof integrationInfo?.icon === 'string' ? integrationInfo.icon : '' // Fallback if component
                };

                // Tell store about this integration (for "Connected to..." header)
                if (isConnected && chatStore.currentLeafId) {
                    chatStore.setActiveIntegration(chatStore.currentLeafId, {
                        name: info.name,
                        icon: info.icon
                    });
                }
                
                console.log(`[Executor] MCP Check: ${matchedIntegration} connected=${isConnected} enabled=${isEnabled}`);
                
                if (!isConnected) {
                    // Not connected - yield message and stop
                    yield { 
                        type: "text", 
                        content: `\n\nYour ${matchedIntegration.charAt(0).toUpperCase() + matchedIntegration.slice(1)} account needs to be connected to ${toolName.replace(/_/g, ' ')}. Please authorize access using the link below:\n\n[Connect ${matchedIntegration.charAt(0).toUpperCase() + matchedIntegration.slice(1)}](/skill-store)`
                    };
                    return;
                }
                
                if (!isEnabled) {
                    console.log(`[Executor] MCP ${matchedIntegration} not enabled - requesting consent`);
                    
                    // Request consent - this will show prompt in UI
                    const enabled = await sessionMCPStore.requestEnable(
                        info,
                        `use ${toolName.replace(/_/g, ' ')}`
                    );
                    
                    if (!enabled) {
                        // User declined - yield polite message
                        yield { 
                            type: "text", 
                            content: `\n\nI understand. I won't access your ${info.name} without your permission. You can enable access anytime from the Connector Store.`
                        };
                        return;
                    }
                    
                    console.log(`[Executor] User enabled ${matchedIntegration} - proceeding`);
                }
            }
        }
        // ------------ END MCP CONSENT CHECK ------------

        // 2. Execute via Registry
        
        // Notify chat store
        import("@/lib/store/chat-store").then(({ chatStore }) => {
            chatStore.setCurrentToolExecution({ name: toolName, label: friendlyLabel });
            if (toolName === 'web_search') {
                chatStore.setIsSearching(true);
            }
        });

        // Start tool activity animation (Reasoning Step)
        const { chatStore } = await import("@/lib/store/chat-store");
        // const { toolActivityStore } = await import("@/lib/store/tool-activity-store");
        // const activityId = toolActivityStore.startTool(toolName, friendlyLabel);
        
        const activityId = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (chatStore.currentLeafId) {
             chatStore.addReasoningStep(chatStore.currentLeafId, {
                 id: activityId,
                 thought: friendlyLabel || `Using ${toolName}...`,
                 status: "thinking",
                 timestamp: Date.now(),
                 toolName: toolName,
                 toolArgs: args
             });
        }

        let result;
        let success = true;
        const toolStartTime = Date.now();
        try {
            result = await toolRegistry.execute(toolName, args);
        } catch (e) {
            console.error(`[Executor] Tool Execution Failed:`, e);
            result = { content: JSON.stringify({ error: "Tool execution failed internal" }) };
            success = false;
        } finally {
            // Telemetry: log tool execution timing
            const { logToolExecution } = await import("@/lib/ai/telemetry");
            logToolExecution({
                toolName,
                executionMs: Date.now() - toolStartTime,
                success,
                error: success ? undefined : "Tool execution failed",
            });
        }

        // Complete tool
        // toolActivityStore.completeTool(activityId, success);
        if (chatStore.currentLeafId) {
            chatStore.updateReasoningStepStatus(chatStore.currentLeafId, activityId, "done");
        }

        // --- CITATION LOGGING ---
        if (toolName === 'web_search' && success && result && typeof result.content === 'string') {
             try {
                 const searchResults = JSON.parse(result.content);
                 if (Array.isArray(searchResults)) {
                     console.log(`[Executor] Web search returned ${searchResults.length} results for citation extraction.`);
                 }
             } catch (e) {
                 console.error("[Executor] Failed to parse search results for citations", e);
             }
        }

        let systemGuidance: string | undefined;
        let chainExecuted = false; // Track if chaining happened (skip normal result push)

        // --- MATR ORCHESTRATION (Using Planner & Policy) ---
        if (success && Policy.requiresChaining(toolName)) {
            console.log(`[Executor] Policy: Tool '${toolName}' requires chaining.`);
            
            // First: Push the ORIGINAL tool result to history before chaining
            const originalResultContent = typeof result === 'string' ? result : JSON.stringify(result);
            const originalToolMsg = { 
                role: "tool", 
                content: originalResultContent, 
                tool_call_id: callId, 
                name: toolName 
            };
            formattedMessages.push(originalToolMsg);
            sanitizedMessages.push(originalToolMsg);
            
            // Prepare chained action with extracted data from result
            const chainTarget = Policy.getChainTarget(toolName);
            if (chainTarget) {
                const chainedAction = Planner.prepareChainedArgs(result, {
                    type: "tool_call",
                    tool: chainTarget,
                    args: {},
                    id: Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, 'x') // Mistral requires exactly 9 alphanumeric chars
                });

                // Only execute if we have valid args (categories found)
                if (Object.keys(chainedAction.args).length > 0) {
                    console.log(`[Executor] Executing chained tool: ${chainedAction.tool}`);
                    
                    // Push ASSISTANT message for chained tool call
                    const chainedAssistantMsg = {
                        role: "assistant",
                        content: "",
                        tool_calls: [{
                            id: chainedAction.id,
                            type: "function",
                            function: { name: chainedAction.tool, arguments: JSON.stringify(chainedAction.args) }
                        }]
                    };
                    formattedMessages.push(chainedAssistantMsg);
                    if (sanitizedMessages !== formattedMessages) {
                        sanitizedMessages.push(chainedAssistantMsg);
                    }
                    
                    // Execute chained tool
                    const chainedResult = await toolRegistry.execute(chainedAction.tool, chainedAction.args);
                    
                    // Push TOOL result for chained tool
                    const chainedResultContent = typeof chainedResult === 'string' ? chainedResult : JSON.stringify(chainedResult);
                    const chainedToolMsg = {
                        role: "tool",
                        content: chainedResultContent,
                        tool_call_id: chainedAction.id,
                        name: chainedAction.tool
                    };
                    formattedMessages.push(chainedToolMsg);
                    if (sanitizedMessages !== formattedMessages) {
                        sanitizedMessages.push(chainedToolMsg);
                    }
                    
                    result = chainedResult;
                    systemGuidance = "Discovery complete. You now have the list of available actions. Please proceed to execute the relevant action to fulfill the user request.";
                    chainExecuted = true; // Mark that we handled history in chaining
                }
            }
        }
        // --- END MATR ORCHESTRATION ---

        // Notify Store Off
        import("@/lib/store/chat-store").then(({ chatStore }) => {
            chatStore.setCurrentToolExecution(null);
            if (toolName === 'web_search' || toolName === 'get_stock') {
                chatStore.setIsSearching(false);
            }
        });

        // Keep tool result content CLEAN (no guidance mixed in)
        const resultContentStr = typeof result === 'string' ? result : (result.content || JSON.stringify(result));

        // 3. Yield CLEAN Result to Client (for citation extraction via JSON.parse)
        yield { type: "tool_result", content: resultContentStr, name: toolName, tool_call_id: callId };


        // 4. Update History with Result (Only if chaining didn't already do this)
        if (!chainExecuted) {
            const toolMsg = { 
                role: "tool", 
                content: resultContentStr, 
                tool_call_id: callId, 
                name: toolName 
            };
            formattedMessages.push(toolMsg);
            if (sanitizedMessages !== formattedMessages) {
                sanitizedMessages.push(toolMsg);
            }

            // 4b. Add citation guidance as SEPARATE system message (not mixed into tool result)
            if (systemGuidance) {
                const guidanceMsg = { role: "user", content: `[System Instruction] ${systemGuidance}` };
                formattedMessages.push(guidanceMsg);
                if (sanitizedMessages !== formattedMessages) {
                    sanitizedMessages.push(guidanceMsg);
                }
            }
        }

        // 5. Recursion (The "Loop")
        // We ask the model: "Here is the result, what next?"
        
        // Use strict scrub logic if needed (Mistral specific, maybe pass as a strategy?)
        // For now, implementing the Mistral-style "Tool Call/Content" scrubbing here or reuse existing
        // We'll trust sanitizedMessages is mostly good, but apply the strictScrub helper if we move it here.
        // Importing strictScrub helper might be Circular if it stays in index.ts. 
        // We will implement a local version or accept it as param.
        
        const strictScrub = (msgs: any[]) => {
            return msgs
                .map(m => {
                    // Assistant with tool_calls: set content to empty string
                    if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
                        return { ...m, content: "" }; 
                    }
                    // Assistant with empty tool_calls array: remove the tool_calls key
                    if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length === 0) {
                        const { tool_calls: _tc, ...rest } = m;
                        return rest;
                    }
                    return m;
                })
                // CRITICAL: Filter out invalid assistant messages (neither content nor tool_calls)
                .filter(m => {
                    if (m.role === 'assistant') {
                        const hasContent = m.content !== undefined && m.content !== null && m.content !== '';
                        const hasToolCalls = m.tool_calls && m.tool_calls.length > 0;
                        if (!hasContent && !hasToolCalls) {
                            console.warn('[Executor] Filtering out empty assistant message:', m);
                            return false; // Remove this message
                        }
                    }
                    return true;
                });
        };

        const finalPayload = strictScrub(sanitizedMessages);
        
        // DEBUG: Log each message to find the problematic one
        console.log("[Executor] === FINAL PAYLOAD DEBUG ===");
        finalPayload.forEach((msg, i) => {
            const hasContent = msg.content !== undefined && msg.content !== null && msg.content !== '';
            const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;
            console.log(`[Executor] Msg ${i}: role=${msg.role}, hasContent=${hasContent}, hasToolCalls=${hasToolCalls}, keys=${Object.keys(msg).join(',')}`);
            if (msg.role === 'assistant' && !hasContent && !hasToolCalls) {
                console.error(`[Executor] ❌ INVALID ASSISTANT MESSAGE AT INDEX ${i}:`, JSON.stringify(msg));
            }
        });
        console.log("[Executor] === END PAYLOAD DEBUG ===");

        const finalReader = await this.fetchStreamFn(finalPayload, apiKey, context);
        const finalGenerator = this.processStreamFn(finalReader);

        for await (const chunk of finalGenerator) {
             if (chunk.type === "text") {
                 yield { type: "text", content: chunk.content };
             }
             // Handle nested tool calls (Deep recursion - up to 5 levels)
             if (chunk.type === "tool_call_chunk") {
                 // Accumulate the tool call buffer
                 const nestedToolCall = chunk.tool_call;
                 console.log(`[Executor] Nested tool call detected: ${nestedToolCall?.function?.name}`);
                 
                 // Recurse! Execute this tool call
                 const nestedGenerator = this.executeToolCall(
                     nestedToolCall,
                     formattedMessages,
                     sanitizedMessages,
                     apiKey
                 );
                 
                 for await (const nestedChunk of nestedGenerator) {
                     yield nestedChunk;
                 }
             }
        }
    }
}
