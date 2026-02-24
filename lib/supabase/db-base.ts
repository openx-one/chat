/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js';
import { MessageNode } from '@/lib/store/chat-store';

export async function createChat(supabase: SupabaseClient, title: string = "New Chat") {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
      console.error("createChat Auth Error:", authError);
      throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) {
      console.error("createChat DB Error:", error);
      throw error;
  }
  return data;
}

export async function fetchChat(supabase: SupabaseClient, chatId: string) {
    const { data } = await supabase.from('chats').select('*').eq('id', chatId).maybeSingle();
    return data;
}

export async function createChatBranch(supabase: SupabaseClient, originalChatId: string, messageId: string, title: string = "Branch") {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('chats')
        .insert({ 
            user_id: user.id, 
            title, 
            branched_from_chat_id: originalChatId,
            branched_from_message_id: messageId
        })
        .select()
        .single();
    
    if (error) {
        console.error("createChatBranch DB Error:", error);
        throw error;
    }
    return data;
}

// Helper to fetch full ancestor chain (recursive)
export async function fetchAncestorMessages(supabase: SupabaseClient, chatId: string, limitMessageId?: string): Promise<any[]> {
    // 1. Get Chat Info to see if it has a parent
    const { data: chat } = await supabase.from('chats').select('branched_from_chat_id, branched_from_message_id').eq('id', chatId).single();
    
    if (!chat) return [];

    let messages: any[] = [];
    
    // 2. Fetch messages for THIS chat
    const query = supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    
    const { data: currentMessages } = await query;
    if (currentMessages) {
        const sorted = currentMessages as any[]; 
        if (limitMessageId) {
            const index = sorted.findIndex(m => m.id === limitMessageId);
            if (index !== -1) {
                messages = sorted.slice(0, index + 1);
            } else {
                 messages = sorted;
            }
        } else {
            messages = sorted;
        }
    }

    // 3. Recursive step: If this chat has a parent, go up
    if (chat.branched_from_chat_id && chat.branched_from_message_id) {
        const parentMessages = await fetchAncestorMessages(supabase, chat.branched_from_chat_id, chat.branched_from_message_id);
        return [...parentMessages, ...messages];
    }

    return messages;
}

export async function saveMessage(supabase: SupabaseClient, chatId: string, message: MessageNode, model: string = 'mistral-large-latest') {
  const { error } = await supabase
    .from('messages')
    .insert({
      id: message.id,
      chat_id: chatId,
      role: message.role,
      content: message.content,
      parent_id: message.parentId,
      model: model,
      attachments: message.attachments || null,
      citations: message.citations || null
    });

  if (error) {
      console.error("saveMessage DB Error:", JSON.stringify(error, null, 2));
      throw error;
  }
}

export async function fetchUserChats(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function updateChatTitle(supabase: SupabaseClient, chatId: string, title: string) {
  const { error } = await supabase
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (error) {
    console.error("updateChatTitle DB Error:", error);
    throw error;
  }
}

export async function updateChatCanvasState(supabase: SupabaseClient, chatId: string, canvasState: any) {
    const { error } = await supabase
        .from('chats')
        .update({ 
            canvas_state: canvasState,
            updated_at: new Date().toISOString() 
        })
        .eq('id', chatId);

    if (error) {
        console.error("updateChatCanvasState DB Error:", error);
        throw error;
    }
}

export async function fetchChatCanvasState(supabase: SupabaseClient, chatId: string) {
    const { data } = await supabase
        .from('chats')
        .select('canvas_state')
        .eq('id', chatId)
        .maybeSingle();
    
    return data?.canvas_state || null;
}

export async function deleteChat(supabase: SupabaseClient, chatId: string) {
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) {
    console.error("deleteChat DB Error:", error);
    throw error;
  }
}

export async function updateChat(supabase: SupabaseClient, chatId: string, updates: { title?: string; is_pinned?: boolean; is_archived?: boolean }) {
  const { error } = await supabase
    .from('chats')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (error) {
    console.error("updateChat DB Error:", error);
    throw error;
  }
}

export async function fetchUserGallery(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      chats (
        id,
        title
      )
    `)
    .ilike('content', '%![%')
    .eq('role', 'assistant')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data;
}

export async function updateUserPreferences(supabase: SupabaseClient, preferences: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('profiles')
        .upsert({ 
            id: user.id, 
            preferences, 
            updated_at: new Date().toISOString() 
        });

    if (error) {
        console.error("Failed to update preferences", error);
        throw error;
    }
}

export async function fetchUserPreferences(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .maybeSingle();
    
    return data?.preferences || null;
}

export async function fetchImageChats(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('chat_id')
        .ilike('content', '%![%')
        .eq('role', 'assistant');

    if (msgError) throw msgError;

    const chatIds = Array.from(new Set(messages.map((m: any) => m.chat_id)));
    if (chatIds.length === 0) return [];

    const { data: chats, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

    if (chatError) throw chatError;

    return chats;
}

export async function saveImageGeneration(supabase: SupabaseClient, generation: {
    prompt: string;
    model: string;
    url: string;
    ratio?: string;
    quality?: string;
    style?: string;
    revised_prompt?: string;
}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('image_generations')
        .insert({
            user_id: user.id,
            ...generation
        })
        .select()
        .single();

    if (error) {
        console.error("saveImageGeneration DB Error:", error);
        throw error;
    }
    return data;
}

export async function fetchImageGenerationHistory(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('image_generations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("fetchImageGenerationHistory DB Error:", error);
        throw error;
    }
    return data;
}

export async function deleteImageGeneration(supabase: SupabaseClient, id: string) {
    const { error } = await supabase
        .from('image_generations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("deleteImageGeneration DB Error:", error);
        throw error;
    }
}
