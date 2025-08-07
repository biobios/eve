/**
 * チャット関連のIPCハンドラー
 * メッセージ送信、会話履歴取得などを担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AIManager } from '../ai-manager';
import { SessionManager } from '../session-manager';
import { BaseHandler } from './base-handler';

export class ChatHandler extends BaseHandler {
    private aiManager: AIManager;
    private sessionManager: SessionManager;

    constructor(aiManager: AIManager, sessionManager: SessionManager) {
        super();
        this.aiManager = aiManager;
        this.sessionManager = sessionManager;
    }

    public setupHandlers(): void {
        this.setupChatHandlers();
    }

    /**
     * チャット機能ハンドラーを設定
     */
    private setupChatHandlers(): void {
        // メッセージを送信するハンドラー
        ipcMain.handle('send-message', async (_event: IpcMainInvokeEvent, message: string) => {
            try {
                if (!this.aiManager.isInitialized()) {
                    throw new Error('AI workflow not initialized. Please set API key first.');
                }

                const currentSessionId = this.sessionManager.getCurrentSessionId();
                if (!currentSessionId) {
                    throw new Error('No active session. Please create or select a session first.');
                }

                this.log(`Sending message to session: ${currentSessionId}`);
                const response = await this.aiManager.sendMessage(message, currentSessionId);
                this.log(`Message sent successfully to session: ${currentSessionId}`);

                return response;
            } catch (error) {
                this.log(`Error sending message: ${error}`, 'error');
                throw error;
            }
        });

        // 会話履歴を取得するハンドラー
        ipcMain.handle('get-conversation-history', async (_event: IpcMainInvokeEvent, sessionId?: string) => {
            try {
                const targetSessionId = sessionId || this.sessionManager.getCurrentSessionId();
                if (!targetSessionId) {
                    this.log('No session available for conversation history');
                    return [];
                }

                const history = await this.aiManager.getConversationHistory(targetSessionId);
                this.log(`Retrieved conversation history for session: ${targetSessionId}, messages: ${history.length}`);

                return history;
            } catch (error) {
                this.log(`Error getting conversation history: ${error}`, 'error');
                return [];
            }
        });

        // 会話履歴をクリアするハンドラー（レガシー互換性のため）
        ipcMain.handle('clear-conversation', async (_event: IpcMainInvokeEvent) => {
            try {
                const currentSessionId = this.sessionManager.getCurrentSessionId();
                if (!currentSessionId) {
                    this.log('No current session to clear');
                    return true;
                }

                const deleted = await this.aiManager.deleteSession(currentSessionId);
                if (deleted) {
                    this.sessionManager.clearCurrentSession();
                    this.log(`Conversation cleared for session: ${currentSessionId}`);
                }

                return deleted;
            } catch (error) {
                this.log(`Error clearing conversation: ${error}`, 'error');
                throw error;
            }
        });
    }
}
