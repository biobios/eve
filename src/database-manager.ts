/**
 * データベース管理の統合クラス
 * すべてのデータベースのマイグレーションとライフサイクルを管理
 */

import { ApiKeyStorage, EncryptionKeyManager } from './crypto-utils';
import { BackupResult, DatabaseBackupManager } from './database-backup-manager';
import { DatabaseHealthChecker, DatabaseHealthStatus } from './database-health-checker';
import { DatabaseLogger } from './database-logger';
import { MigrationManager } from './database-migration';
import { getDatabaseConfigs } from './database-migrations-config';

/**
 * データベース管理マネージャー
 * アプリケーション全体のデータベース操作を統合管理
 */
export class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private migrationManager: MigrationManager;
    private healthChecker: DatabaseHealthChecker;
    private backupManager: DatabaseBackupManager;
    private logger: DatabaseLogger;
    private isInitialized: boolean = false;

    private constructor() {
        this.migrationManager = new MigrationManager();
        this.healthChecker = new DatabaseHealthChecker(this.migrationManager);
        this.backupManager = new DatabaseBackupManager(this.migrationManager);
        this.logger = new DatabaseLogger(this.migrationManager);
    }

    /**
     * シングルトンインスタンスを取得
     */
    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    /**
     * データベースシステムを初期化
     */
    public async initialize(): Promise<{ success: boolean; errors: string[] }> {
        if (this.isInitialized) {
            this.logger.logAlreadyInitialized();
            return { success: true, errors: [] };
        }

        this.logger.logSystemStartup();

        try {
            // マイグレーション設定を追加
            const configs = getDatabaseConfigs();
            for (const config of configs) {
                this.migrationManager.addDatabase(config);
            }

            // 全データベースのマイグレーションを実行
            const result = await this.migrationManager.migrateAll();

            if (result.success) {
                this.isInitialized = true;
                this.logger.logInitializationSuccess();
                return { success: true, errors: [] };
            } else {
                // エラーメッセージを収集
                const allErrors: string[] = [];
                for (const [dbName, dbResult] of Object.entries(result.results)) {
                    if (!dbResult.success) {
                        allErrors.push(...dbResult.errors.map(err => `${dbName}: ${err}`));
                    }
                }
                this.logger.logInitializationFailure(allErrors);
                return { success: false, errors: allErrors };
            }
        } catch (error) {
            const errorMsg = `Database initialization error: ${error}`;
            console.error(errorMsg);
            return {
                success: false,
                errors: [errorMsg]
            };
        }
    }

    /**
     * データベースのヘルスチェック
     */
    public async healthCheck(): Promise<DatabaseHealthStatus> {
        return await this.healthChecker.checkHealth();
    }

    /**
     * 全データベースのバックアップを作成
     */
    public async createBackup(): Promise<BackupResult> {
        return await this.backupManager.createBackup();
    }

    /**
     * システム終了時のクリーンアップ
     */
    public async shutdown(): Promise<void> {
        this.logger.logSystemShutdown();

        try {
            // 各データベースクラスのクリーンアップ
            EncryptionKeyManager.closeDatabase();
            ApiKeyStorage.closeDatabase();

            // マイグレーションマネージャーのクリーンアップ
            this.migrationManager.closeAll();

            this.isInitialized = false;
            this.logger.logShutdownComplete();
        } catch (error) {
            this.logger.logShutdownError(error);
        }
    }

    /**
     * マイグレーション情報を取得
     */
    public getMigrationInfo(): ReturnType<MigrationManager['getAllStatus']> {
        return this.migrationManager.getAllStatus();
    }

    /**
     * 初期化状態を確認
     */
    public isSystemInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * 開発用: 特定のデータベースのマイグレーションをロールバック
     */
    public async rollbackDatabase(dbName: string, targetVersion: number): Promise<{ success: boolean; errors: string[] }> {
        const migrator = this.migrationManager.getMigrator(dbName);
        if (!migrator) {
            return {
                success: false,
                errors: [`Database ${dbName} not found`]
            };
        }

        this.logger.logRollbackStart(dbName, targetVersion);
        const result = await migrator.rollback(targetVersion);

        if (result.success) {
            this.logger.logRollbackComplete(dbName);
        } else {
            this.logger.logRollbackFailure(dbName, result.errors);
        }

        return result;
    }

    /**
     * 開発用: 強制的にマイグレーションを再実行
     */
    public async forceMigration(): Promise<{ success: boolean; results: { [dbName: string]: { success: boolean; errors: string[] } } }> {
        this.logger.logForceMigration();
        return await this.migrationManager.migrateAll();
    }
}
