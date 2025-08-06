/**
 * IPC処理クラス
 * フロントエンドとの通信を担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AIManager } from './ai-manager';
import { ApiKeyStorage } from './crypto-utils';
import { DatabaseManager } from './database-manager';
import { SessionManager } from './session-manager';
import { SessionInfo } from './session-storage';
import { SettingsManager } from './settings-manager';
import { WindowManager } from './window-manager';

export class IPCHandlers {
    private aiManager: AIManager;
    private sessionManager: SessionManager;
    private apiKeyStorage: ApiKeyStorage;
    private settingsManager: SettingsManager;
    private windowManager: WindowManager | null = null;

    constructor(aiManager: AIManager, sessionManager: SessionManager, apiKeyStorage: ApiKeyStorage, windowManager?: WindowManager) {
        this.aiManager = aiManager;
        this.sessionManager = sessionManager;
        this.apiKeyStorage = apiKeyStorage;
        this.settingsManager = SettingsManager.getInstance();
        this.windowManager = windowManager || null;
    }

    /**
     * すべてのIPCハンドラーを設定
     */
    public setupHandlers(): void {
        this.setupApiKeyHandlers();
        this.setupSessionHandlers();
        this.setupChatHandlers();
        this.setupUtilityHandlers();
        this.setupDatabaseHandlers();
        this.setupInitialSetupHandlers();
    }

    /**
     * APIキー関連のハンドラーを設定
     */
    private setupApiKeyHandlers(): void {
        // APIキーを設定するハンドラー（保存オプション付き）
        ipcMain.handle('set-api-key', async (_event: IpcMainInvokeEvent, apiKey: string, saveKey: boolean = false) => {
            return await this.aiManager.initialize(apiKey, saveKey);
        });

        // 保存されたAPIキーが存在するかチェック
        ipcMain.handle('has-saved-api-key', async (_event: IpcMainInvokeEvent) => {
            try {
                const savedKey = await this.apiKeyStorage.getApiKey('gemini');
                return savedKey !== null;
            } catch (error) {
                console.error('Error checking saved API key:', error);
                return false;
            }
        });

        // 保存されたAPIキーを削除
        ipcMain.handle('delete-saved-api-key', async (_event: IpcMainInvokeEvent) => {
            try {
                await this.apiKeyStorage.deleteApiKey('gemini');
                console.log('Saved API key deleted');
                return true;
            } catch (error) {
                console.error('Error deleting saved API key:', error);
                return false;
            }
        });

        // AIの初期化状態をチェック
        ipcMain.handle('is-ai-initialized', async (_event: IpcMainInvokeEvent) => {
            return this.aiManager.isInitialized();
        });

        // 新しいAPIキー管理機能

        // 全APIキーの一覧を取得
        ipcMain.handle('get-all-api-keys', async (_event: IpcMainInvokeEvent, serviceName?: string) => {
            try {
                if (serviceName) {
                    return await this.apiKeyStorage.getAllApiKeysForService(serviceName);
                } else {
                    // 全サービスのAPIキーを取得（現在はGeminiのみ）
                    return await this.apiKeyStorage.getAllApiKeysForService('gemini');
                }
            } catch (error) {
                console.error('Error getting API keys:', error);
                return [];
            }
        });

        // APIキーを追加
        ipcMain.handle('add-api-key', async (_event: IpcMainInvokeEvent, serviceName: string, apiKey: string, aiModel: string, description?: string) => {
            try {
                const apiKeyId = await this.apiKeyStorage.saveApiKey(serviceName, apiKey, aiModel, description);
                console.log(`API key added with ID: ${apiKeyId}`);
                return { success: true, apiKeyId };
            } catch (error) {
                console.error('Error adding API key:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // APIキーをIDで削除
        ipcMain.handle('delete-api-key-by-id', async (_event: IpcMainInvokeEvent, apiKeyId: number) => {
            try {
                await this.apiKeyStorage.deleteApiKeyById(apiKeyId);
                console.log(`API key deleted with ID: ${apiKeyId}`);
                return { success: true };
            } catch (error) {
                console.error('Error deleting API key:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // アクティブなAPIキーを設定（設定値に保存）
        ipcMain.handle('set-active-api-key', async (_event: IpcMainInvokeEvent, apiKeyId: number) => {
            try {
                // APIキーの情報を取得
                const apiKeyInfo = await this.apiKeyStorage.getApiKeyById(apiKeyId);
                if (!apiKeyInfo) {
                    return { success: false, error: 'API key not found' };
                }

                // 設定に保存
                await this.settingsManager.setSetting('api_key_id', apiKeyId, 'number', '使用するAPIキーのID');

                // AIを新しいAPIキーで初期化
                const initResult = await this.aiManager.initialize(apiKeyInfo.apiKey, false, apiKeyInfo.aiModel);

                console.log(`Active API key set to ID: ${apiKeyId}`);
                return { success: initResult };
            } catch (error) {
                console.error('Error setting active API key:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // 現在のアクティブなAPIキーIDを取得
        ipcMain.handle('get-active-api-key-id', async (_event: IpcMainInvokeEvent) => {
            try {
                const config = await this.settingsManager.getCurrentConfig();
                return config.apiKeyId || null;
            } catch (error) {
                console.error('Error getting active API key ID:', error);
                return null;
            }
        });
    }

    /**
     * セッション関連のハンドラーを設定
     */
    private setupSessionHandlers(): void {
        // 新しいセッションを作成するハンドラー
        ipcMain.handle('create-session', async (_event: IpcMainInvokeEvent) => {
            return this.sessionManager.createSession();
        });

        // セッションを切り替えるハンドラー
        ipcMain.handle('switch-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
            return this.sessionManager.switchSession(sessionId);
        });

        // セッション一覧を取得するハンドラー
        ipcMain.handle('get-sessions', async (_event: IpcMainInvokeEvent): Promise<SessionInfo[]> => {
            return await this.aiManager.getAllSessions();
        });

        // セッションを削除するハンドラー
        ipcMain.handle('delete-session', async (_event: IpcMainInvokeEvent, sessionId: string) => {
            const deleted = await this.aiManager.deleteSession(sessionId);

            // 現在のセッションが削除された場合はリセット
            if (deleted && this.sessionManager.getCurrentSessionId() === sessionId) {
                this.sessionManager.clearCurrentSession();
            }

            return deleted;
        });
    }

    /**
     * チャット関連のハンドラーを設定
     */
    private setupChatHandlers(): void {
        // メッセージを送信するハンドラー
        ipcMain.handle('send-message', async (_event: IpcMainInvokeEvent, message: string) => {
            if (!this.aiManager.isInitialized()) {
                throw new Error('AI workflow not initialized. Please set API key first.');
            }

            const currentSessionId = this.sessionManager.getCurrentSessionId();
            if (!currentSessionId) {
                throw new Error('No active session. Please create or select a session first.');
            }

            return await this.aiManager.sendMessage(message, currentSessionId);
        });

        // 会話履歴を取得するハンドラー
        ipcMain.handle('get-conversation-history', async (_event: IpcMainInvokeEvent, sessionId?: string) => {
            const targetSessionId = sessionId || this.sessionManager.getCurrentSessionId();
            if (!targetSessionId) {
                return [];
            }

            return await this.aiManager.getConversationHistory(targetSessionId);
        });

        // 会話履歴をクリアするハンドラー（レガシー互換性のため）
        ipcMain.handle('clear-conversation', async (_event: IpcMainInvokeEvent) => {
            const currentSessionId = this.sessionManager.getCurrentSessionId();
            if (!currentSessionId) {
                return true;
            }

            const deleted = await this.aiManager.deleteSession(currentSessionId);
            if (deleted) {
                this.sessionManager.clearCurrentSession();
            }
            return deleted;
        });
    }

    /**
     * ユーティリティハンドラーを設定
     */
    private setupUtilityHandlers(): void {
        // バージョン情報を取得するハンドラー
        ipcMain.handle('get-version', async (_event: IpcMainInvokeEvent) => {
            return process.versions.electron;
        });
    }

    /**
     * データベース関連のハンドラーを設定
     */
    private setupDatabaseHandlers(): void {
        // データベースの状態を取得
        ipcMain.handle('get-database-status', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                return {
                    success: true,
                    initialized: dbManager.isSystemInitialized(),
                    migrationInfo: dbManager.getMigrationInfo()
                };
            } catch (error) {
                console.error('Error getting database status:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // データベースのヘルスチェック
        ipcMain.handle('database-health-check', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                const healthCheck = await dbManager.healthCheck();
                return {
                    success: true,
                    ...healthCheck
                };
            } catch (error) {
                console.error('Database health check failed:', error);
                return {
                    success: false,
                    overall: false,
                    databases: {},
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });

        // データベースバックアップを作成
        ipcMain.handle('create-database-backup', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                const result = await dbManager.createBackup();
                return {
                    success: result.success,
                    backupPaths: result.backupPaths,
                    errors: result.errors
                };
            } catch (error) {
                console.error('Database backup failed:', error);
                return {
                    success: false,
                    backupPaths: [],
                    errors: [error instanceof Error ? error.message : 'Unknown error']
                };
            }
        });

        // 開発用: マイグレーションを強制実行
        ipcMain.handle('force-migration', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                const result = await dbManager.forceMigration();
                return {
                    success: result.success,
                    results: result.results
                };
            } catch (error) {
                console.error('Force migration failed:', error);
                return {
                    success: false,
                    results: {},
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }

    /**
     * 初期設定関連のハンドラーを設定
     */
    private setupInitialSetupHandlers(): void {
        // 初期設定を保存
        ipcMain.handle('save-initial-setup', async (_event: IpcMainInvokeEvent, config: {
            userName: string;
            aiService: string;
            aiModel: string;
            apiKey: string;
        }) => {
            try {
                // APIキーを保存
                const apiKeyId = await this.apiKeyStorage.saveApiKey(
                    config.aiService,
                    config.apiKey,
                    config.aiModel,
                    `${config.aiService} - ${config.aiModel}`
                );

                // 初期設定情報を保存
                await this.settingsManager.saveInitialSetup({
                    userName: config.userName,
                    apiKeyId: apiKeyId
                });

                // 初期設定が完了したので、メインウィンドウを開く
                if (this.windowManager) {
                    setTimeout(() => {
                        this.windowManager?.openMainWindowAfterSetup();
                    }, 100);
                }

                return {
                    success: true,
                    apiKeyId: apiKeyId
                };
            } catch (error) {
                console.error('Error saving initial setup:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
}
