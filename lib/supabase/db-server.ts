/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from './server-client';
import * as base from './db-base';
import { MessageNode } from '@/lib/store/chat-store';

export const createChat = (title?: string) => base.createChat(createClient(), title);
export const createChatBranch = (originalChatId: string, messageId: string, title?: string) => 
    base.createChatBranch(createClient(), originalChatId, messageId, title);
export const fetchAncestorMessages = (chatId: string, limitMessageId?: string) => 
    base.fetchAncestorMessages(createClient(), chatId, limitMessageId);
export const fetchMessages = (chatId: string) => 
    base.fetchAncestorMessages(createClient(), chatId);
export const saveMessage = (chatId: string, message: MessageNode, model?: string) => 
    base.saveMessage(createClient(), chatId, message, model);
export const fetchUserChats = () => base.fetchUserChats(createClient());
export const updateChatTitle = (chatId: string, title: string) => base.updateChatTitle(createClient(), chatId, title);
export const updateChatCanvasState = (chatId: string, canvasState: any) => base.updateChatCanvasState(createClient(), chatId, canvasState);
export const fetchChatCanvasState = (chatId: string) => base.fetchChatCanvasState(createClient(), chatId);
export const deleteChat = (chatId: string) => base.deleteChat(createClient(), chatId);
export const updateChat = (chatId: string, updates: any) => base.updateChat(createClient(), chatId, updates);
export const fetchUserGallery = () => base.fetchUserGallery(createClient());
export const updateUserPreferences = (preferences: any) => base.updateUserPreferences(createClient(), preferences);
export const fetchUserPreferences = () => base.fetchUserPreferences(createClient());
export const fetchImageChats = () => base.fetchImageChats(createClient());

export const saveImageGeneration = (generation: any) => base.saveImageGeneration(createClient(), generation);
export const fetchImageGenerationHistory = () => base.fetchImageGenerationHistory(createClient());
export const deleteImageGeneration = (id: string) => base.deleteImageGeneration(createClient(), id);
