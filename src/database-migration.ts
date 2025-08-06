/**
 * データベースマイグレーション管理システム
 * スキーマバージョン管理と自動マイグレーション機能を提供
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface Migration {
    version: number;
    description: string;
    up: (db: Database.Database) => void;
    down?: (db: Database.Database) => void;
}

export interface DatabaseConfig {
    name: string;
    path: string;
    migrations: Migration[];
}

/**
 * データベースマイグレーション管理クラス
 */
export class DatabaseMigrator {
    private db: Database.Database;
    private config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        this.config = config;
        this.db = new Database(config.path);
        this.initializeMigrationTable();
    }

    /**
     * マイグレーション管理用テーブルを初期化
     */
    private initializeMigrationTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * 現在のスキーマバージョンを取得
     */
    public getCurrentVersion(): number {
        const result = this.db.prepare(`
            SELECT MAX(version) as version FROM schema_migrations
        `).get() as { version: number | null };

        return result.version || 0;
    }

    /**
     * 適用済みマイグレーションの一覧を取得
     */
    public getAppliedMigrations(): { version: number; description: string; applied_at: string }[] {
        return this.db.prepare(`
            SELECT version, description, applied_at 
            FROM schema_migrations 
            ORDER BY version
        `).all() as { version: number; description: string; applied_at: string }[];
    }

    /**
     * 保留中のマイグレーションを取得
     */
    public getPendingMigrations(): Migration[] {
        const currentVersion = this.getCurrentVersion();
        return this.config.migrations.filter(migration => migration.version > currentVersion);
    }

    /**
     * マイグレーションを実行
     */
    public async migrate(): Promise<{ success: boolean; errors: string[] }> {
        const pendingMigrations = this.getPendingMigrations();
        const errors: string[] = [];

        if (pendingMigrations.length === 0) {
            console.log(`[${this.config.name}] No pending migrations`);
            return { success: true, errors: [] };
        }

        console.log(`[${this.config.name}] Running ${pendingMigrations.length} migration(s)...`);

        // トランザクション内でマイグレーションを実行
        const transaction = this.db.transaction(() => {
            for (const migration of pendingMigrations) {
                try {
                    console.log(`[${this.config.name}] Applying migration ${migration.version}: ${migration.description}`);

                    // マイグレーションを実行
                    migration.up(this.db);

                    // マイグレーション記録を保存
                    this.db.prepare(`
                        INSERT INTO schema_migrations (version, description)
                        VALUES (?, ?)
                    `).run(migration.version, migration.description);

                    console.log(`[${this.config.name}] Successfully applied migration ${migration.version}`);
                } catch (error) {
                    const errorMsg = `Failed to apply migration ${migration.version}: ${error}`;
                    console.error(`[${this.config.name}] ${errorMsg}`);
                    errors.push(errorMsg);
                    throw error; // ロールバックのためにエラーを再投げ
                }
            }
        });

        try {
            transaction();
            console.log(`[${this.config.name}] All migrations completed successfully`);
            return { success: true, errors: [] };
        } catch (error) {
            console.error(`[${this.config.name}] Migration failed, transaction rolled back:`, error);
            return { success: false, errors };
        }
    }

    /**
     * マイグレーションをロールバック（指定されたバージョンまで）
     */
    public async rollback(targetVersion: number): Promise<{ success: boolean; errors: string[] }> {
        const currentVersion = this.getCurrentVersion();
        const errors: string[] = [];

        if (targetVersion >= currentVersion) {
            console.log(`[${this.config.name}] Already at or below target version ${targetVersion}`);
            return { success: true, errors: [] };
        }

        // ロールバック対象のマイグレーションを取得（降順）
        const migrationsToRollback = this.config.migrations
            .filter(migration => migration.version > targetVersion && migration.version <= currentVersion)
            .sort((a, b) => b.version - a.version); // 降順にソート

        console.log(`[${this.config.name}] Rolling back ${migrationsToRollback.length} migration(s)...`);

        // トランザクション内でロールバックを実行
        const transaction = this.db.transaction(() => {
            for (const migration of migrationsToRollback) {
                try {
                    console.log(`[${this.config.name}] Rolling back migration ${migration.version}: ${migration.description}`);

                    if (migration.down) {
                        // ロールバック処理を実行
                        migration.down(this.db);
                    } else {
                        throw new Error(`No rollback defined for migration ${migration.version}`);
                    }

                    // マイグレーション記録を削除
                    this.db.prepare(`
                        DELETE FROM schema_migrations WHERE version = ?
                    `).run(migration.version);

                    console.log(`[${this.config.name}] Successfully rolled back migration ${migration.version}`);
                } catch (error) {
                    const errorMsg = `Failed to rollback migration ${migration.version}: ${error}`;
                    console.error(`[${this.config.name}] ${errorMsg}`);
                    errors.push(errorMsg);
                    throw error; // ロールバックのためにエラーを再投げ
                }
            }
        });

        try {
            transaction();
            console.log(`[${this.config.name}] Rollback completed successfully to version ${targetVersion}`);
            return { success: true, errors: [] };
        } catch (error) {
            console.error(`[${this.config.name}] Rollback failed, transaction rolled back:`, error);
            return { success: false, errors };
        }
    }

    /**
     * データベース接続を閉じる
     */
    public close(): void {
        if (this.db) {
            this.db.close();
        }
    }

    /**
     * データベースの状態情報を取得
     */
    public getStatus(): {
        name: string;
        currentVersion: number;
        pendingMigrations: number;
        appliedMigrations: { version: number; description: string; applied_at: string }[];
    } {
        return {
            name: this.config.name,
            currentVersion: this.getCurrentVersion(),
            pendingMigrations: this.getPendingMigrations().length,
            appliedMigrations: this.getAppliedMigrations()
        };
    }
}

/**
 * マイグレーション管理マネージャー
 * 複数のデータベースのマイグレーションを一括管理
 */
export class MigrationManager {
    private migrators: Map<string, DatabaseMigrator> = new Map();

    /**
     * データベースマイグレーターを追加
     */
    public addDatabase(config: DatabaseConfig): void {
        const migrator = new DatabaseMigrator(config);
        this.migrators.set(config.name, migrator);
    }

    /**
     * 全データベースのマイグレーションを実行
     */
    public async migrateAll(): Promise<{ success: boolean; results: { [dbName: string]: { success: boolean; errors: string[] } } }> {
        const results: { [dbName: string]: { success: boolean; errors: string[] } } = {};
        let overallSuccess = true;

        console.log('Starting migration for all databases...');

        for (const [name, migrator] of this.migrators) {
            console.log(`\n=== Migrating ${name} ===`);
            const result = await migrator.migrate();
            results[name] = result;

            if (!result.success) {
                overallSuccess = false;
                console.error(`Migration failed for ${name}:`, result.errors);
            }
        }

        console.log('\n=== Migration Summary ===');
        for (const [name, result] of Object.entries(results)) {
            console.log(`${name}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            if (!result.success) {
                result.errors.forEach(error => console.log(`  - ${error}`));
            }
        }

        return { success: overallSuccess, results };
    }

    /**
     * 全データベースの状態を取得
     */
    public getAllStatus(): { [dbName: string]: ReturnType<DatabaseMigrator['getStatus']> } {
        const status: { [dbName: string]: ReturnType<DatabaseMigrator['getStatus']> } = {};

        for (const [name, migrator] of this.migrators) {
            status[name] = migrator.getStatus();
        }

        return status;
    }

    /**
     * 指定されたデータベースのマイグレーターを取得
     */
    public getMigrator(name: string): DatabaseMigrator | undefined {
        return this.migrators.get(name);
    }

    /**
     * 全データベース接続を閉じる
     */
    public closeAll(): void {
        for (const migrator of this.migrators.values()) {
            migrator.close();
        }
        this.migrators.clear();
    }

    /**
     * バックアップディレクトリを作成
     */
    public createBackupDirectory(): string {
        const backupDir = path.join(app.getPath('userData'), 'db-backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        return backupDir;
    }

    /**
     * データベースファイルをバックアップ
     */
    public async backupDatabase(dbName: string): Promise<string | null> {
        const migrator = this.migrators.get(dbName);
        if (!migrator) {
            console.error(`Database ${dbName} not found`);
            return null;
        }

        try {
            const backupDir = this.createBackupDirectory();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${dbName}_${timestamp}.db`);

            // 現在のDBパスを取得（configから）
            const config = Array.from(this.migrators.entries())
                .find(([name]) => name === dbName)?.[1];

            if (config) {
                // ファイルをコピー
                fs.copyFileSync((config as any).config.path, backupPath);
                console.log(`Database ${dbName} backed up to: ${backupPath}`);
                return backupPath;
            }

            return null;
        } catch (error) {
            console.error(`Failed to backup database ${dbName}:`, error);
            return null;
        }
    }
}
