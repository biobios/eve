/**
 * ユーティリティ関連のIPCハンドラー
 * バージョン情報などの汎用機能を担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { BaseHandler } from './base-handler';

export class UtilityHandler extends BaseHandler {
    constructor() {
        super();
    }

    public setupHandlers(): void {
        this.setupUtilityHandlers();
    }

    /**
     * ユーティリティハンドラーを設定
     */
    private setupUtilityHandlers(): void {
        // バージョン情報を取得するハンドラー
        ipcMain.handle('get-version', async (_event: IpcMainInvokeEvent) => {
            try {
                const version = process.versions.electron;
                this.log(`Version requested: ${version}`);
                return version;
            } catch (error) {
                this.log(`Error getting version: ${error}`, 'error');
                throw error;
            }
        });
    }
}
