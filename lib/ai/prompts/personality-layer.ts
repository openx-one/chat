import { chatStore } from "@/lib/store/chat-store";

/**
 * Style map for base style overrides.
 * Each style affects LANGUAGE AND TONE ONLY — never structure or formatting.
 */
const STYLE_MAP: Record<string, string> = {
  professional: "You are a highly disciplined PROFESSIONAL assistant. Your tone must be POLISHED, PRECISE, and FORMAL. Avoid colloquialisms. Structure your responses for maximum clarity.",
  friendly: "You are a WARM and FRIENDLY assistant. Your tone should be chatty, helpful, and approachable, like a kind colleague.",
  candid: "You are a CANDID assistant. Be DIRECT, ENCOURAGING, and honest. Don't sugarcoat, but be constructive.",
  quirky: "You are a QUIRKY assistant. Be PLAYFUL, IMAGINATIVE, and don't be afraid to use colorful metaphors or slight whimsy.",
  efficient: "You are an EFFICIENT assistant. Be CONCISE and PLAIN. Do not waffle. Get straight to the point.",
  nerdy: "You are a NERDY assistant. Be EXPLORATORY and ENTHUSIASTIC about technical details. Geek out where appropriate.",
  cynical: "You are a CYNICAL assistant. Be CRITICAL and slightly SARCASTIC. Question assumptions and don't be overly optimistic.",
};

/**
 * Guardrail suffix appended to every personality injection.
 * Prevents tone from bleeding into structure/format.
 */
const PERSONALITY_GUARDRAIL = `
IMPORTANT: Personality and tone affect your LANGUAGE and WORDING only.
You must NOT modify: markdown structure, widget JSON format, citation format, or tool call behavior.
Follow all formatting, widget, and citation rules exactly as specified regardless of personality.`;

/**
 * Builds the personality layer for system prompt injection.
 * This should always be injected LAST before runtime context.
 * 
 * Includes: base style, trait adjustments, user context, custom instructions.
 */
export function buildPersonalityLayer(): string {
  let result = "";

  // 1. Base Style Override
  if (chatStore.baseStyle && chatStore.baseStyle !== 'default') {
    const styleInstruction = STYLE_MAP[chatStore.baseStyle] || `Style/Tone: ${chatStore.baseStyle}`;
    result += `\n\n### PERSONA INSTRUCTION (CRITICALLY IMPORTANT):\n${styleInstruction}`;
  }

  // 2. Trait Adjustments
  if (chatStore.characteristics) {
    const chars = Object.entries(chatStore.characteristics)
      .filter(([, v]) => v !== 'default');

    if (chars.length > 0) {
      result += `\n\n### TRAIT ADJUSTMENTS:`;
      chars.forEach(([k, v]) => {
        const trait = k.replace(/_/g, ' ');
        if (v === 'more') result += `\n- Be MORE ${trait}.`;
        if (v === 'less') result += `\n- Be LESS ${trait}.`;
      });
    }
  }

  // 3. User Context
  if (chatStore.aboutYou) {
    const about = [];
    if (chatStore.aboutYou.nickname) about.push(`User Nickname: ${chatStore.aboutYou.nickname}`);
    if (chatStore.aboutYou.occupation) about.push(`User Occupation: ${chatStore.aboutYou.occupation}`);
    if (chatStore.aboutYou.bio) about.push(`User Bio: ${chatStore.aboutYou.bio}`);

    if (about.length > 0) {
      result += `\n\n### USER CONTEXT:\n${about.join('\n')}`;
    }
  }

  // 4. Custom Instructions
  if (chatStore.customInstructions) {
    result += `\n\n### CUSTOM USER INSTRUCTIONS:\n${chatStore.customInstructions}`;
  }

  // 5. Guardrail (always appended)
  if (result.trim().length > 0) {
    result += `\n${PERSONALITY_GUARDRAIL}`;
  }

  return result;
}
