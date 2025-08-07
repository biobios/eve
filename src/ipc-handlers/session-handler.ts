/**
 * セッション関連のIPCハンドラー
 * セッションの作成、切り替え、削除などを担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AIManager } from '../ai-manager';
import { SessionManager } from '../session-manager';
import { SessionInfo } from '../session-storage';
import { BaseHandler } from './base-handler';

export class SessionHandler extends BaseHandler {
    private aiManager: AIManager;
    private sessionManager: SessionManager;

    constructor(aiManager: AIManager, sessionManager: SessionManager) {
        super();
        this.aiManager = aiManager;
        this.sessionManager = sessionManager;
    }

    public setupHandlers(): void {
        this.setupSessionManagementHandlers();
    }

    /**
     * セッション管理ハンドラーを設定
     */
    private setupSessionManagementHandlers(): void {
        // 新しいセッションを作成するハンドラー
        ipcMain.handle('create-session', async (_event: IpcMainInvokeEvent) => {
            try {
                const session = this.sessionManager.createSession();
                this.log(`Session created: ${session.id}`);
                return session;
            } catch (error) {
                this.log(`Error creating session: ${error}`, 'error');
                throw error;
            }
        });

        // セッションを切り替えるハンドラー
        ipcMain.handle('switch-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const result = this.sessionManager.switchSession(sessionId);
                this.log(`Session switched to: ${sessionId}`, result ? 'info' : 'warn');
                return result;
            } catch (error) {
                this.log(`Error switching session: ${error}`, 'error');
                throw error;
            }
        });

        // セッション一覧を取得するハンドラー
        ipcMain.handle('get-sessions', async (_event: IpcMainInvokeEvent): Promise<SessionInfo[]> => {
            try {
                const sessions = await this.aiManager.getAllSessions();
                this.log(`Retrieved ${sessions.length} sessions`);
                return sessions;
            } catch (error) {
                this.log(`Error getting sessions: ${error}`, 'error');
                return [];
            }
        });

        // セッションを削除するハンドラー
        ipcMain.handle('delete-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const deleted = await this.aiManager.deleteSession(sessionId);

                // 現在のセッションが削除された場合はリセット
                if (deleted && this.sessionManager.getCurrentSessionId() === sessionId) {
                    this.sessionManager.clearCurrentSession();
                    this.log(`Current session cleared after deletion: ${sessionId}`);
                }

                this.log(`Session deletion result for ${sessionId}: ${deleted}`);
                return deleted;
            } catch (error) {
                this.log(`Error deleting session: ${error}`, 'error');
                throw error;
            }
        });
    }
}
