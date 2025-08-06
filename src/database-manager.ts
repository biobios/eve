/**
 * データベース管理の統合クラス
 * すべてのデータベースのマイグレーションとライフサイクルを管理
 */

import { ApiKeyStorage, EncryptionKeyManager } from './crypto-utils';
import { MigrationManager } from './database-migration';
import { getDatabaseConfigs } from './database-migrations-config';

/**
 * データベース管理マネージャー
 * アプリケーション全体のデータベース操作を統合管理
 */
export class DatabaseManager {
    private static instance: DatabaseManager | null = null;
    private migrationManager: MigrationManager;
    private isInitialized: boolean = false;

    private constructor() {
        this.migrationManager = new MigrationManager();
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
            console.log('Database system already initialized');
            return { success: true, errors: [] };
        }

        console.log('Initializing database system...');

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
                console.log('Database system initialized successfully');

                // マイグレーションステータスをログ出力
                await this.logMigrationStatus();

                return { success: true, errors: [] };
            } else {
                console.error('Database system initialization failed');

                // エラーメッセージを収集
                const allErrors: string[] = [];
                for (const [dbName, dbResult] of Object.entries(result.results)) {
                    if (!dbResult.success) {
                        allErrors.push(...dbResult.errors.map(err => `${dbName}: ${err}`));
                    }
                }

                return { success: false, errors: allErrors };
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            return {
                success: false,
                errors: [`Database initialization error: ${error}`]
            };
        }
    }

    /**
     * データベースのヘルスチェック
     */
    public async healthCheck(): Promise<{
        overall: boolean;
        databases: { [name: string]: { healthy: boolean; error?: string } }
    }> {
        const result = {
            overall: true,
            databases: {} as { [name: string]: { healthy: boolean; error?: string } }
        };

        const configs = getDatabaseConfigs();

        for (const config of configs) {
            try {
                const migrator = this.migrationManager.getMigrator(config.name);
                if (migrator) {
                    const status = migrator.getStatus();
                    result.databases[config.name] = {
                        healthy: true,
                        error: undefined
                    };
                } else {
                    result.databases[config.name] = {
                        healthy: false,
                        error: 'Migrator not found'
                    };
                    result.overall = false;
                }
            } catch (error) {
                result.databases[config.name] = {
                    healthy: false,
                    error: `Health check failed: ${error}`
                };
                result.overall = false;
            }
        }

        return result;
    }

    /**
     * マイグレーションステータスをログ出力
     */
    private async logMigrationStatus(): Promise<void> {
        const status = this.migrationManager.getAllStatus();

        console.log('\n=== Database Migration Status ===');
        for (const [name, dbStatus] of Object.entries(status)) {
            console.log(`${name}:`);
            console.log(`  Current Version: ${dbStatus.currentVersion}`);
            console.log(`  Pending Migrations: ${dbStatus.pendingMigrations}`);
            console.log(`  Applied Migrations: ${dbStatus.appliedMigrations.length}`);

            if (dbStatus.appliedMigrations.length > 0) {
                console.log('  Recent migrations:');
                dbStatus.appliedMigrations
                    .slice(-3) // 最新3件
                    .forEach(migration => {
                        console.log(`    v${migration.version}: ${migration.description} (${migration.applied_at})`);
                    });
            }
        }
        console.log('================================\n');
    }

    /**
     * 全データベースのバックアップを作成
     */
    public async createBackup(): Promise<{ success: boolean; backupPaths: string[]; errors: string[] }> {
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
                    errors.push(`Failed to create backup for ${config.name}`);
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
     * システム終了時のクリーンアップ
     */
    public async shutdown(): Promise<void> {
        console.log('Shutting down database system...');

        try {
            // 各データベースクラスのクリーンアップ
            EncryptionKeyManager.closeDatabase();
            ApiKeyStorage.closeDatabase();

            // マイグレーションマネージャーのクリーンアップ
            this.migrationManager.closeAll();

            this.isInitialized = false;
            console.log('Database system shutdown completed');
        } catch (error) {
            console.error('Error during database shutdown:', error);
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

        console.log(`Rolling back ${dbName} to version ${targetVersion}...`);
        const result = await migrator.rollback(targetVersion);

        if (result.success) {
            console.log(`Rollback completed for ${dbName}`);
        } else {
            console.error(`Rollback failed for ${dbName}:`, result.errors);
        }

        return result;
    }

    /**
     * 開発用: 強制的にマイグレーションを再実行
     */
    public async forceMigration(): Promise<{ success: boolean; results: { [dbName: string]: { success: boolean; errors: string[] } } }> {
        console.log('Force re-running all migrations...');
        return await this.migrationManager.migrateAll();
    }
}
