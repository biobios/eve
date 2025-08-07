/**
 * データベース関連のIPCハンドラー
 * データベース状態、ヘルスチェック、バックアップなどを担当
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { DatabaseManager } from '../database-manager';
import { BaseHandler } from './base-handler';

export class DatabaseHandler extends BaseHandler {
    constructor() {
        super();
    }

    public setupHandlers(): void {
        this.setupDatabaseHandlers();
    }

    /**
     * データベース管理ハンドラーを設定
     */
    private setupDatabaseHandlers(): void {
        // データベースの状態を取得
        ipcMain.handle('get-database-status', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                const status = {
                    success: true,
                    initialized: dbManager.isSystemInitialized(),
                    migrationInfo: dbManager.getMigrationInfo()
                };

                this.log(`Database status retrieved: initialized=${status.initialized}`);
                return status;
            } catch (error) {
                this.log(`Error getting database status: ${error}`, 'error');
                return this.createErrorResponse(error);
            }
        });

        // データベースのヘルスチェック
        ipcMain.handle('database-health-check', async (_event: IpcMainInvokeEvent) => {
            try {
                const dbManager = DatabaseManager.getInstance();
                const healthCheck = await dbManager.healthCheck();

                this.log(`Database health check completed: overall=${healthCheck.overall}`);
                return this.createSuccessResponse(healthCheck);
            } catch (error) {
                this.log(`Database health check failed: ${error}`, 'error');
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

                this.log(`Database backup completed: success=${result.success}, files=${result.backupPaths.length}`);
                return {
                    success: result.success,
                    backupPaths: result.backupPaths,
                    errors: result.errors
                };
            } catch (error) {
                this.log(`Database backup failed: ${error}`, 'error');
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

                this.log(`Force migration completed: success=${result.success}`);
                return {
                    success: result.success,
                    results: result.results
                };
            } catch (error) {
                this.log(`Force migration failed: ${error}`, 'error');
                return {
                    success: false,
                    results: {},
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
}
