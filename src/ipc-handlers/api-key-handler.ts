/**
 * APIキー関連のIPCハンドラー
 * APIキーの設定、管理、削除などを担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AIManager } from '../ai-manager';
import { ApiKeyStorage } from '../crypto-utils';
import { SettingsManager } from '../settings-manager';
import { BaseHandler } from './base-handler';

export class ApiKeyHandler extends BaseHandler {
    private aiManager: AIManager;
    private apiKeyStorage: ApiKeyStorage;
    private settingsManager: SettingsManager;

    constructor(aiManager: AIManager, apiKeyStorage: ApiKeyStorage) {
        super();
        this.aiManager = aiManager;
        this.apiKeyStorage = apiKeyStorage;
        this.settingsManager = SettingsManager.getInstance();
    }

    public setupHandlers(): void {
        this.setupBasicApiKeyHandlers();
        this.setupAdvancedApiKeyHandlers();
    }

    /**
     * 基本的なAPIキーハンドラーを設定
     */
    private setupBasicApiKeyHandlers(): void {
        // APIキーを設定するハンドラー（保存オプション付き）
        ipcMain.handle('set-api-key', async (_event: IpcMainInvokeEvent, apiKey: string, saveKey: boolean = false) => {
            try {
                const result = await this.aiManager.initialize(apiKey, saveKey);
                this.log(`API key set with save option: ${saveKey}`, result ? 'info' : 'error');
                return result;
            } catch (error) {
                this.log(`API key setup failed: ${error}`, 'error');
                throw error;
            }
        });

        // 保存されたAPIキーが存在するかチェック
        ipcMain.handle('has-saved-api-key', async (_event: IpcMainInvokeEvent) => {
            try {
                const savedKey = await this.apiKeyStorage.getApiKey('gemini');
                return savedKey !== null;
            } catch (error) {
                this.log(`Error checking saved API key: ${error}`, 'error');
                return false;
            }
        });

        // 保存されたAPIキーを削除
        ipcMain.handle('delete-saved-api-key', async (_event: IpcMainInvokeEvent) => {
            try {
                await this.apiKeyStorage.deleteApiKey('gemini');
                this.log('Saved API key deleted');
                return true;
            } catch (error) {
                this.log(`Error deleting saved API key: ${error}`, 'error');
                return false;
            }
        });

        // AIの初期化状態をチェック
        ipcMain.handle('is-ai-initialized', async (_event: IpcMainInvokeEvent) => {
            return this.aiManager.isInitialized();
        });
    }

    /**
     * 高度なAPIキー管理ハンドラーを設定
     */
    private setupAdvancedApiKeyHandlers(): void {
        // 全APIキーの一覧を取得
        ipcMain.handle('get-all-api-keys', async (_event: IpcMainInvokeEvent, serviceName?: string) => {
            try {
                const service = serviceName || 'gemini';
                const apiKeys = await this.apiKeyStorage.getAllApiKeysForService(service);
                this.log(`Retrieved ${apiKeys.length} API keys for service: ${service}`);
                return apiKeys;
            } catch (error) {
                this.log(`Error getting API keys: ${error}`, 'error');
                return [];
            }
        });

        // APIキーを追加
        ipcMain.handle('add-api-key', async (_event: IpcMainInvokeEvent, serviceName: string, apiKey: string, aiModel: string, description?: string) => {
            try {
                const apiKeyId = await this.apiKeyStorage.saveApiKey(serviceName, apiKey, aiModel, description);
                this.log(`API key added with ID: ${apiKeyId}`);
                return this.createSuccessResponse({ apiKeyId });
            } catch (error) {
                this.log(`Error adding API key: ${error}`, 'error');
                return this.createErrorResponse(error);
            }
        });

        // APIキーをIDで削除
        ipcMain.handle('delete-api-key-by-id', async (_event: IpcMainInvokeEvent, apiKeyId: number) => {
            try {
                await this.apiKeyStorage.deleteApiKeyById(apiKeyId);
                this.log(`API key deleted with ID: ${apiKeyId}`);
                return this.createSuccessResponse();
            } catch (error) {
                this.log(`Error deleting API key: ${error}`, 'error');
                return this.createErrorResponse(error);
            }
        });

        // アクティブなAPIキーを設定（設定値に保存）
        ipcMain.handle('set-active-api-key', async (_event: IpcMainInvokeEvent, apiKeyId: number) => {
            try {
                // APIキーの情報を取得
                const apiKeyInfo = await this.apiKeyStorage.getApiKeyById(apiKeyId);
                if (!apiKeyInfo) {
                    return this.createErrorResponse(new Error('API key not found'));
                }

                // 設定に保存
                await this.settingsManager.setSetting('api_key_id', apiKeyId, 'number', '使用するAPIキーのID');

                // AIを新しいAPIキーで初期化
                const initResult = await this.aiManager.initialize(apiKeyInfo.apiKey, false, apiKeyInfo.aiModel);

                this.log(`Active API key set to ID: ${apiKeyId}`);
                return this.createSuccessResponse({ initialized: initResult });
            } catch (error) {
                this.log(`Error setting active API key: ${error}`, 'error');
                return this.createErrorResponse(error);
            }
        });

        // 現在のアクティブなAPIキーIDを取得
        ipcMain.handle('get-active-api-key-id', async (_event: IpcMainInvokeEvent) => {
            try {
                const config = await this.settingsManager.getCurrentConfig();
                return config.apiKeyId || null;
            } catch (error) {
                this.log(`Error getting active API key ID: ${error}`, 'error');
                return null;
            }
        });
    }
}
