/**
 * APIキーストレージクラス
 * SQLiteデータベースに暗号化されたAPIキーを保存・管理
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import { DatabaseMigrator } from '../database-migration';
import { apiKeyMigrations } from '../database-migrations-config';
import { DataEncryption } from './data-encryption';

export class ApiKeyStorage {
    private static dbPath = path.join(app.getPath('userData'), 'apikeys.db');
    private static db: Database.Database | null = null;
    private static migrator: DatabaseMigrator | null = null;
    private dataEncryption: DataEncryption;

    constructor(dataEncryption: DataEncryption) {
        this.dataEncryption = dataEncryption;
        // 同期的な初期化は行わず、必要時に初期化
    }

    /**
     * データベースの初期化を確認（必要時に初期化）
     */
    private async ensureInitialized(): Promise<void> {
        if (!ApiKeyStorage.db) {
            await this.initDatabase();
        }
    }

    /**
     * データベースを初期化（マイグレーション対応）
     */
    private async initDatabase(): Promise<void> {
        // マイグレーションを実行
        await this.runMigrations();

        ApiKeyStorage.db = new Database(ApiKeyStorage.dbPath);
    }

    /**
     * マイグレーションを実行
     */
    private async runMigrations(): Promise<void> {
        if (!ApiKeyStorage.migrator) {
            ApiKeyStorage.migrator = new DatabaseMigrator({
                name: 'apikeys',
                path: ApiKeyStorage.dbPath,
                migrations: apiKeyMigrations
            });
        }

        const result = await ApiKeyStorage.migrator.migrate();
        if (!result.success) {
            console.error('API keys database migration failed:', result.errors);
            throw new Error('Failed to migrate API keys database');
        }
    }

    /**
     * APIキーを保存する（AIモデル情報付き）
     * @param serviceName サービス名（例: 'gemini'）
     * @param apiKey APIキー
     * @param aiModel AIモデル名（例: 'gemini-2.0-flash'）
     * @param description 説明（オプション）
     */
    public async saveApiKey(serviceName: string, apiKey: string, aiModel?: string, description?: string): Promise<number> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const encryptedKey = this.dataEncryption.encrypt(apiKey);

        // service_nameとai_modelの組み合わせが既に存在するかチェック
        const existingStmt = ApiKeyStorage.db.prepare(`
      SELECT id FROM api_keys 
      WHERE service_name = ? AND (ai_model = ? OR (ai_model IS NULL AND ? IS NULL))
    `);
        const existing = existingStmt.get(serviceName, aiModel, aiModel) as { id: number } | undefined;

        if (existing) {
            // 既存のレコードを更新
            const updateStmt = ApiKeyStorage.db.prepare(`
        UPDATE api_keys 
        SET encrypted_api_key = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
            updateStmt.run(encryptedKey, description, existing.id);
            return existing.id;
        } else {
            // 新しいレコードを挿入
            const insertStmt = ApiKeyStorage.db.prepare(`
        INSERT INTO api_keys (service_name, encrypted_api_key, ai_model, description, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
            const result = insertStmt.run(serviceName, encryptedKey, aiModel, description);
            return result.lastInsertRowid as number;
        }
    }

    /**
     * APIキー情報を取得する（AIモデル情報付き）
     * @param serviceName サービス名（例: 'gemini'）
     * @param aiModel AIモデル名（オプション、指定しない場合は最初に見つかったものを返す）
     * @returns APIキー情報、見つからない場合はnull
     */
    public async getApiKeyInfo(serviceName: string, aiModel?: string): Promise<{
        id: number;
        serviceName: string;
        apiKey: string;
        aiModel?: string;
        description?: string;
        isActive: boolean;
        lastUsedAt?: string;
        createdAt: string;
        updatedAt: string;
    } | null> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        let selectStmt;
        let result;

        if (aiModel !== undefined) {
            // 特定のモデルを指定して検索
            selectStmt = ApiKeyStorage.db.prepare(`
        SELECT id, service_name, encrypted_api_key, ai_model, description, 
               is_active, last_used_at, created_at, updated_at
        FROM api_keys 
        WHERE service_name = ? AND (ai_model = ? OR (ai_model IS NULL AND ? IS NULL))
        ORDER BY created_at DESC
        LIMIT 1
      `);
            result = selectStmt.get(serviceName, aiModel, aiModel);
        } else {
            // サービス名のみで検索（最初に見つかったものを返す）
            selectStmt = ApiKeyStorage.db.prepare(`
        SELECT id, service_name, encrypted_api_key, ai_model, description, 
               is_active, last_used_at, created_at, updated_at
        FROM api_keys 
        WHERE service_name = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
            result = selectStmt.get(serviceName);
        }

        const typedResult = result as {
            id: number;
            service_name: string;
            encrypted_api_key: string;
            ai_model?: string;
            description?: string;
            is_active: number;
            last_used_at?: string;
            created_at: string;
            updated_at: string;
        } | undefined;

        if (typedResult) {
            try {
                const decryptedKey = this.dataEncryption.decrypt(typedResult.encrypted_api_key);
                return {
                    id: typedResult.id,
                    serviceName: typedResult.service_name,
                    apiKey: decryptedKey,
                    aiModel: typedResult.ai_model,
                    description: typedResult.description,
                    isActive: Boolean(typedResult.is_active),
                    lastUsedAt: typedResult.last_used_at,
                    createdAt: typedResult.created_at,
                    updatedAt: typedResult.updated_at
                };
            } catch (error) {
                console.error('Failed to decrypt API key:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * IDでAPIキー情報を取得する
     * @param id APIキーID
     * @returns APIキー情報、見つからない場合はnull
     */
    public async getApiKeyById(id: number): Promise<{
        id: number;
        serviceName: string;
        apiKey: string;
        aiModel?: string;
        description?: string;
        isActive: boolean;
        lastUsedAt?: string;
        createdAt: string;
        updatedAt: string;
    } | null> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const selectStmt = ApiKeyStorage.db.prepare(`
      SELECT id, service_name, encrypted_api_key, ai_model, description, 
             is_active, last_used_at, created_at, updated_at
      FROM api_keys 
      WHERE id = ?
    `);
        const result = selectStmt.get(id) as {
            id: number;
            service_name: string;
            encrypted_api_key: string;
            ai_model?: string;
            description?: string;
            is_active: number;
            last_used_at?: string;
            created_at: string;
            updated_at: string;
        } | undefined;

        if (result) {
            try {
                const decryptedKey = this.dataEncryption.decrypt(result.encrypted_api_key);
                return {
                    id: result.id,
                    serviceName: result.service_name,
                    apiKey: decryptedKey,
                    aiModel: result.ai_model,
                    description: result.description,
                    isActive: Boolean(result.is_active),
                    lastUsedAt: result.last_used_at,
                    createdAt: result.created_at,
                    updatedAt: result.updated_at
                };
            } catch (error) {
                console.error('Failed to decrypt API key:', error);
                return null;
            }
        }

        return null;
    }

    /**
     * APIキーを取得する（後方互換性のため）
     * @param serviceName サービス名（例: 'gemini'）
     * @param aiModel AIモデル名（オプション）
     * @returns APIキー（復号化済み）、見つからない場合はnull
     */
    public async getApiKey(serviceName: string, aiModel?: string): Promise<string | null> {
        const info = await this.getApiKeyInfo(serviceName, aiModel);
        return info ? info.apiKey : null;
    }

    /**
     * サービス名に関連するすべてのAPIキー情報を取得する
     * @param serviceName サービス名（例: 'gemini'）
     * @returns APIキー情報の配列
     */
    public async getAllApiKeysForService(serviceName: string): Promise<Array<{
        id: number;
        serviceName: string;
        apiKey: string;
        aiModel?: string;
        description?: string;
        isActive: boolean;
        lastUsedAt?: string;
        createdAt: string;
        updatedAt: string;
    }>> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const selectStmt = ApiKeyStorage.db.prepare(`
      SELECT id, service_name, encrypted_api_key, ai_model, description, 
             is_active, last_used_at, created_at, updated_at
      FROM api_keys 
      WHERE service_name = ?
      ORDER BY ai_model, created_at DESC
    `);
        const results = selectStmt.all(serviceName) as Array<{
            id: number;
            service_name: string;
            encrypted_api_key: string;
            ai_model?: string;
            description?: string;
            is_active: number;
            last_used_at?: string;
            created_at: string;
            updated_at: string;
        }>;

        const decryptedResults = [];
        for (const result of results) {
            try {
                const decryptedKey = this.dataEncryption.decrypt(result.encrypted_api_key);
                decryptedResults.push({
                    id: result.id,
                    serviceName: result.service_name,
                    apiKey: decryptedKey,
                    aiModel: result.ai_model,
                    description: result.description,
                    isActive: Boolean(result.is_active),
                    lastUsedAt: result.last_used_at,
                    createdAt: result.created_at,
                    updatedAt: result.updated_at
                });
            } catch (error) {
                console.error(`Failed to decrypt API key for ID ${result.id}:`, error);
                // エラーが発生したキーはスキップ
            }
        }

        return decryptedResults;
    }

    /**
     * APIキーを削除する
     * @param serviceName サービス名（例: 'gemini'）
     * @param aiModel AIモデル名（オプション、指定しない場合はサービス全体を削除）
     */
    public async deleteApiKey(serviceName: string, aiModel?: string): Promise<void> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        if (aiModel !== undefined) {
            // 特定のモデルのみ削除
            const deleteStmt = ApiKeyStorage.db.prepare(`
        DELETE FROM api_keys 
        WHERE service_name = ? AND (ai_model = ? OR (ai_model IS NULL AND ? IS NULL))
      `);
            deleteStmt.run(serviceName, aiModel, aiModel);
        } else {
            // サービス全体を削除
            const deleteStmt = ApiKeyStorage.db.prepare('DELETE FROM api_keys WHERE service_name = ?');
            deleteStmt.run(serviceName);
        }
    }

    /**
     * IDでAPIキーを削除する
     * @param id APIキーID
     */
    public async deleteApiKeyById(id: number): Promise<void> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const deleteStmt = ApiKeyStorage.db.prepare('DELETE FROM api_keys WHERE id = ?');
        deleteStmt.run(id);
    }

    /**
     * 保存されているすべてのサービス名を取得する（重複なし）
     * @returns サービス名の配列
     */
    public async getStoredServices(): Promise<string[]> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const selectStmt = ApiKeyStorage.db.prepare('SELECT DISTINCT service_name FROM api_keys ORDER BY service_name');
        const results = selectStmt.all() as { service_name: string }[];

        return results.map(row => row.service_name);
    }

    /**
     * 保存されているサービスとモデルの組み合わせを取得する
     * @returns サービス名とモデル名の組み合わせの配列
     */
    public async getStoredServiceModels(): Promise<Array<{ serviceName: string; aiModel?: string; id: number }>> {
        await this.ensureInitialized();

        if (!ApiKeyStorage.db) {
            throw new Error('Database not initialized');
        }

        const selectStmt = ApiKeyStorage.db.prepare(`
      SELECT id, service_name, ai_model 
      FROM api_keys 
      ORDER BY service_name, ai_model
    `);
        const results = selectStmt.all() as Array<{ id: number; service_name: string; ai_model?: string }>;

        return results.map(row => ({
            id: row.id,
            serviceName: row.service_name,
            aiModel: row.ai_model
        }));
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
            this.migrator = new DatabaseMigrator({
                name: 'apikeys',
                path: this.dbPath,
                migrations: apiKeyMigrations
            });
        }
        return this.migrator?.getStatus() || null;
    }
}
