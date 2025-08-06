/**
 * 設定管理システム
 * ユーザー設定と初期セットアップ状態を管理
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';

export interface UserSetting {
    id?: number;
    setting_key: string;
    setting_value: string;
    setting_type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface InitialSetupConfig {
    userName: string;
    aiService: string;
    aiModel: string;
    apiKeyId: number;
}

export class SettingsManager {
    private static instance: SettingsManager | null = null;
    private db: Database.Database | null = null;
    private readonly dbPath: string;

    private constructor() {
        const userDataPath = app.getPath('userData');
        this.dbPath = path.join(userDataPath, 'settings.db');
    }

    /**
     * シングルトンインスタンスを取得
     */
    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    /**
     * データベース接続を初期化
     */
    public async initialize(): Promise<void> {
        try {
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');
            console.log('Settings database initialized');
        } catch (error) {
            console.error('Failed to initialize settings database:', error);
            throw error;
        }
    }

    /**
     * 初期セットアップが完了しているかチェック
     */
    public async isInitialSetupCompleted(): Promise<boolean> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            const stmt = this.db!.prepare('SELECT is_completed FROM initial_setup ORDER BY id DESC LIMIT 1');
            const result = stmt.get() as { is_completed: number } | undefined;

            return result ? Boolean(result.is_completed) : false;
        } catch (error) {
            console.error('Error checking initial setup status:', error);
            return false;
        }
    }

    /**
     * 初期セットアップを完了としてマーク
     */
    public async markInitialSetupCompleted(): Promise<void> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            const stmt = this.db!.prepare(`
                INSERT INTO initial_setup (is_completed, completed_at, updated_at) 
                VALUES (1, datetime('now'), datetime('now'))
            `);
            stmt.run();
            console.log('Initial setup marked as completed');
        } catch (error) {
            console.error('Error marking initial setup as completed:', error);
            throw error;
        }
    }

    /**
     * 設定値を保存
     */
    public async setSetting(key: string, value: any, type: 'string' | 'number' | 'boolean' | 'json' = 'string', description?: string): Promise<void> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            let stringValue: string;

            switch (type) {
                case 'json':
                    stringValue = JSON.stringify(value);
                    break;
                case 'boolean':
                    stringValue = value ? '1' : '0';
                    break;
                case 'number':
                    stringValue = String(value);
                    break;
                default:
                    stringValue = String(value);
            }

            const stmt = this.db!.prepare(`
                INSERT OR REPLACE INTO user_settings 
                (setting_key, setting_value, setting_type, description, updated_at) 
                VALUES (?, ?, ?, ?, datetime('now'))
            `);

            stmt.run(key, stringValue, type, description);
            console.log(`Setting saved: ${key}`);
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * 設定値を取得
     */
    public async getSetting<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            const stmt = this.db!.prepare('SELECT setting_value, setting_type FROM user_settings WHERE setting_key = ?');
            const result = stmt.get(key) as { setting_value: string; setting_type: string } | undefined;

            if (!result) {
                return defaultValue;
            }

            switch (result.setting_type) {
                case 'json':
                    return JSON.parse(result.setting_value) as T;
                case 'boolean':
                    return (result.setting_value === '1') as T;
                case 'number':
                    return Number(result.setting_value) as T;
                default:
                    return result.setting_value as T;
            }
        } catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * 全設定を取得
     */
    public async getAllSettings(): Promise<UserSetting[]> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            const stmt = this.db!.prepare('SELECT * FROM user_settings ORDER BY setting_key');
            return stmt.all() as UserSetting[];
        } catch (error) {
            console.error('Error getting all settings:', error);
            return [];
        }
    }

    /**
     * 設定を削除
     */
    public async deleteSetting(key: string): Promise<void> {
        if (!this.db) {
            await this.initialize();
        }

        try {
            const stmt = this.db!.prepare('DELETE FROM user_settings WHERE setting_key = ?');
            stmt.run(key);
            console.log(`Setting deleted: ${key}`);
        } catch (error) {
            console.error(`Error deleting setting ${key}:`, error);
            throw error;
        }
    }

    /**
     * 初期セットアップ設定を保存
     */
    public async saveInitialSetup(config: InitialSetupConfig): Promise<void> {
        try {
            // ユーザー名を保存
            await this.setSetting('user_name', config.userName, 'string', 'ユーザーの名前');

            // AIサービスを保存
            await this.setSetting('ai_service', config.aiService, 'string', '使用するAIサービス');

            // AIモデルを保存
            await this.setSetting('ai_model', config.aiModel, 'string', '使用するAIモデル');

            // APIキーIDを保存
            await this.setSetting('api_key_id', config.apiKeyId, 'number', '使用するAPIキーのID');

            // 初期セットアップ完了をマーク
            await this.markInitialSetupCompleted();

            console.log('Initial setup configuration saved');
        } catch (error) {
            console.error('Error saving initial setup configuration:', error);
            throw error;
        }
    }

    /**
     * 現在の設定を取得
     */
    public async getCurrentConfig(): Promise<Partial<InitialSetupConfig>> {
        try {
            const userName = await this.getSetting('user_name');
            const aiService = await this.getSetting('ai_service');
            const aiModel = await this.getSetting('ai_model');
            const apiKeyId = await this.getSetting<number>('api_key_id');

            return {
                userName,
                aiService,
                aiModel,
                apiKeyId
            };
        } catch (error) {
            console.error('Error getting current configuration:', error);
            return {};
        }
    }

    /**
     * データベース接続を閉じる
     */
    public async shutdown(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Settings database connection closed');
        }
    }
}
