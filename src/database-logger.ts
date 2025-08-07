/**
 * データベースログ管理クラス
 * データベース関連のログ出力と状態表示を担当
 */

import { MigrationManager } from './database-migration';

export class DatabaseLogger {
    private migrationManager: MigrationManager;

    constructor(migrationManager: MigrationManager) {
        this.migrationManager = migrationManager;
    }

    /**
     * マイグレーションステータスをログ出力
     */
    public logMigrationStatus(): void {
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
     * 初期化完了ログを出力
     */
    public logInitializationSuccess(): void {
        console.log('Database system initialized successfully');
        this.logMigrationStatus();
    }

    /**
     * 初期化失敗ログを出力
     */
    public logInitializationFailure(errors: string[]): void {
        console.error('Database system initialization failed');
        errors.forEach(error => console.error(`  - ${error}`));
    }

    /**
     * システム起動時ログを出力
     */
    public logSystemStartup(): void {
        console.log('Initializing database system...');
    }

    /**
     * システム終了時ログを出力
     */
    public logSystemShutdown(): void {
        console.log('Shutting down database system...');
    }

    /**
     * システム終了完了ログを出力
     */
    public logShutdownComplete(): void {
        console.log('Database system shutdown completed');
    }

    /**
     * システム終了エラーログを出力
     */
    public logShutdownError(error: any): void {
        console.error('Error during database shutdown:', error);
    }

    /**
     * 既に初期化済みの場合のログを出力
     */
    public logAlreadyInitialized(): void {
        console.log('Database system already initialized');
    }

    /**
     * マイグレーション強制実行ログを出力
     */
    public logForceMigration(): void {
        console.log('Force re-running all migrations...');
    }

    /**
     * ロールバック開始ログを出力
     */
    public logRollbackStart(dbName: string, targetVersion: number): void {
        console.log(`Rolling back ${dbName} to version ${targetVersion}...`);
    }

    /**
     * ロールバック完了ログを出力
     */
    public logRollbackComplete(dbName: string): void {
        console.log(`Rollback completed for ${dbName}`);
    }

    /**
     * ロールバック失敗ログを出力
     */
    public logRollbackFailure(dbName: string, errors: string[]): void {
        console.error(`Rollback failed for ${dbName}:`, errors);
    }
}
