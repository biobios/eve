/**
 * 初期設定関連のIPCハンドラー
 * 初期セットアップの設定保存などを担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { ApiKeyStorage } from '../crypto-utils';
import { SettingsManager } from '../settings-manager';
import { WindowManager } from '../window-manager';
import { BaseHandler } from './base-handler';

interface InitialSetupConfig {
    userName: string;
    aiService: string;
    aiModel: string;
    apiKey: string;
}

export class InitialSetupHandler extends BaseHandler {
    private apiKeyStorage: ApiKeyStorage;
    private settingsManager: SettingsManager;
    private windowManager: WindowManager | null;

    constructor(apiKeyStorage: ApiKeyStorage, windowManager?: WindowManager) {
        super();
        this.apiKeyStorage = apiKeyStorage;
        this.settingsManager = SettingsManager.getInstance();
        this.windowManager = windowManager || null;
    }

    public setupHandlers(): void {
        this.setupInitialSetupHandlers();
    }

    /**
     * 初期設定ハンドラーを設定
     */
    private setupInitialSetupHandlers(): void {
        // 初期設定を保存
        ipcMain.handle('save-initial-setup', async (_event: IpcMainInvokeEvent, config: InitialSetupConfig) => {
            try {
                this.log(`Saving initial setup for user: ${config.userName}`);

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

                this.log(`Initial setup completed successfully for user: ${config.userName}, API key ID: ${apiKeyId}`);

                // 初期設定が完了したので、メインウィンドウを開く
                if (this.windowManager) {
                    setTimeout(() => {
                        this.windowManager?.openMainWindowAfterSetup();
                    }, 100);
                }

                return this.createSuccessResponse({ apiKeyId });
            } catch (error) {
                this.log(`Error saving initial setup: ${error}`, 'error');
                return this.createErrorResponse(error);
            }
        });
    }
}
