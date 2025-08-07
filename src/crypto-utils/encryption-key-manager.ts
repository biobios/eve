/**
 * 暗号化キーの管理クラス
 * Electron safeStorageを使用してマスターキーを安全に保存・管理
 */

import Database from 'better-sqlite3';
import { app, safeStorage } from 'electron';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseMigrator } from '../database-migration';
import { encryptionKeyMigrations } from '../database-migrations-config';

export class EncryptionKeyManager {
    private static dbPath = path.join(app.getPath('userData'), 'encryption.db');
    private static db: Database.Database | null = null;
    private static migrator: DatabaseMigrator | null = null;

    /**
     * データベースを初期化（マイグレーション対応）
     */
    private static async initDatabase(): Promise<Database.Database> {
        if (!this.db) {
            // マイグレーションを実行
            await this.runMigrations();

            this.db = new Database(this.dbPath);
        }
        return this.db;
    }

    /**
     * マイグレーションを実行
     */
    private static async runMigrations(): Promise<void> {
        if (!this.migrator) {
            this.migrator = new DatabaseMigrator({
                name: 'encryption',
                path: this.dbPath,
                migrations: encryptionKeyMigrations
            });
        }

        const result = await this.migrator.migrate();
        if (!result.success) {
            console.error('Encryption database migration failed:', result.errors);
            throw new Error('Failed to migrate encryption database');
        }
    }

    /**
     * 暗号化キーを生成またはロードする
     * @param keyName キーの名前（識別子）
     * @returns 暗号化キー（Base64エンコード済み）
     */
    public static async getOrCreateEncryptionKey(keyName: string = 'master'): Promise<string> {
        const db = await this.initDatabase();

        // 既存のキーを検索
        const selectStmt = db.prepare('SELECT encrypted_key FROM encryption_keys WHERE key_name = ?');
        const existing = selectStmt.get(keyName) as { encrypted_key: Buffer } | undefined;

        if (existing) {
            // 既存のキーをElectronのsafeStorageで復号
            const decryptedKeyBuffer = safeStorage.decryptString(existing.encrypted_key);
            return decryptedKeyBuffer;
        } else {
            // 新しいキーを生成
            const newKey = uuidv4();

            // ElectronのsafeStorageで暗号化
            const encryptedKey = safeStorage.encryptString(newKey);

            // データベースに保存
            const insertStmt = db.prepare(`
        INSERT INTO encryption_keys (key_name, encrypted_key)
        VALUES (?, ?)
      `);
            insertStmt.run(keyName, encryptedKey);

            return newKey;
        }
    }

    /**
     * データベース接続を閉じる
     */
    public static closeDatabase(): void {
        if (this.migrator) {
            this.migrator.close();
            this.migrator = null;
        }
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     * マイグレーションステータスを取得
     */
    public static async getMigrationStatus(): Promise<ReturnType<DatabaseMigrator['getStatus']> | null> {
        if (!this.migrator) {
            await this.runMigrations();
        }
        return this.migrator?.getStatus() || null;
    }
}
