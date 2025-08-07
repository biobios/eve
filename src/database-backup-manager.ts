/**
 * データベースバックアップ管理クラス
 * データベースのバックアップ作成と管理を担当
 */

import { MigrationManager } from './database-migration';
import { getDatabaseConfigs } from './database-migrations-config';

export interface BackupResult {
    success: boolean;
    backupPaths: string[];
    errors: string[];
}

export class DatabaseBackupManager {
    private migrationManager: MigrationManager;

    constructor(migrationManager: MigrationManager) {
        this.migrationManager = migrationManager;
    }

    /**
     * 全データベースのバックアップを作成
     */
    public async createBackup(): Promise<BackupResult> {
        const backupPaths: string[] = [];
        const errors: string[] = [];

        const configs = getDatabaseConfigs();

        for (const config of configs) {
            try {
                const backupPath = await this.migrationManager.backupDatabase(config.name);
                if (backupPath) {
                    backupPaths.push(backupPath);
                    console.log(`Backup created for ${config.name}: ${backupPath}`);
                } else {
                    const error = `Failed to create backup for ${config.name}`;
                    errors.push(error);
                    console.error(error);
                }
            } catch (error) {
                const errorMsg = `Backup failed for ${config.name}: ${error}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        return {
            success: errors.length === 0,
            backupPaths,
            errors
        };
    }

    /**
     * 個別データベースのバックアップを作成
     */
    public async createDatabaseBackup(dbName: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
        try {
            const backupPath = await this.migrationManager.backupDatabase(dbName);
            if (backupPath) {
                console.log(`Backup created for ${dbName}: ${backupPath}`);
                return {
                    success: true,
                    backupPath
                };
            } else {
                const error = `Failed to create backup for ${dbName}`;
                console.error(error);
                return {
                    success: false,
                    error
                };
            }
        } catch (error) {
            const errorMsg = `Backup failed for ${dbName}: ${error}`;
            console.error(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        }
    }
}
