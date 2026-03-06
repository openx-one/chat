import { Tool } from "../types";

export const readUrlTool: Tool = {
    definition: {
        name: "read_url",
        description: "Fetch and read the raw text content of a specific URL provided by the user. Use this when the user explicitly provides a link and asks you to summarize, read, or analyze it. Use this INSTEAD of 'web_search' for specific URLs.",
        parameters: {
            type: "object",
            properties: {
                url: {
                    type: "string",
                    description: "The fully qualified URL to read (e.g. https://example.com/article)"
                }
            },
            required: ["url"]
        }
    },
    execute: async (args: { url: string }) => {
        try {
            console.log(`[Tool:read_url] Scraping URL: ${args.url}`);
            
            // Validate URL to prevent generic errors
            let targetUrl = args.url;
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                 targetUrl = 'https://' + targetUrl;
            }

            // Using Jina Reader API for clean Markdown extraction
            const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/event-stream', // Can also accept application/json, but default returns md string
                }
            });

            if (!response.ok) {
                console.error(`[Tool:read_url] Failed with status: ${response.status}`);
                return {
                    content: `Failed to read URL. Status: ${response.status} ${response.statusText}. The website might be blocking scrapers.`
                };
            }

            const markdownContent = await response.text();
            
            // Clean up potentially massive payloads. LLMs usually tap out or get confused past ~15-20k chars
            // We'll return the first ~25,000 characters to stay safe within context limits.
            const MAX_LENGTH = 25000;
            const truncatedContent = markdownContent.length > MAX_LENGTH 
                ? markdownContent.substring(0, MAX_LENGTH) + "\n\n...[Content truncated due to length limits]..." 
                : markdownContent;

            return {
                content: truncatedContent
            };
        } catch (error) {
            console.error("[Tool:read_url] Execution error:", error);
            return {
                content: `Error reading URL: ${error instanceof Error ? error.message : "Unknown error occurred"}`
            };
        }
    }
};
