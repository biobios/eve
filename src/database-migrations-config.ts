/**
 * データベースマイグレーション定義
 * 各データベースのスキーマ変更履歴とマイグレーション手順を定義
 */

import { app } from 'electron';
import * as path from 'path';
import { DatabaseConfig, Migration } from './database-migration';

/**
 * 暗号化キーデータベースのマイグレーション定義
 */
export const encryptionKeyMigrations: Migration[] = [
    {
        version: 1,
        description: 'Create encryption_keys table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS encryption_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key_name TEXT UNIQUE NOT NULL,
                    encrypted_key BLOB NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS encryption_keys`);
        }
    },
    {
        version: 2,
        description: 'Add index on key_name for encryption_keys',
        up: (db) => {
            db.exec(`
                CREATE INDEX IF NOT EXISTS idx_encryption_keys_key_name 
                ON encryption_keys(key_name)
            `);
        },
        down: (db) => {
            db.exec(`DROP INDEX IF EXISTS idx_encryption_keys_key_name`);
        }
    }
];

/**
 * APIキーデータベースのマイグレーション定義
 * 単一のマイグレーションで最終的なテーブル構造を作成
 */
export const apiKeyMigrations: Migration[] = [
    {
        version: 1,
        description: 'Create api_keys table with support for multiple models per service',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS api_keys (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    service_name TEXT NOT NULL,
                    ai_model TEXT,
                    encrypted_api_key TEXT NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT 1,
                    last_used_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_api_keys_service_name 
                ON api_keys(service_name);
                
                CREATE INDEX IF NOT EXISTS idx_api_keys_service_model 
                ON api_keys(service_name, ai_model);
            `);
        },
        down: (db) => {
            db.exec(`
                DROP INDEX IF EXISTS idx_api_keys_service_model;
                DROP INDEX IF EXISTS idx_api_keys_service_name;
                DROP TABLE IF EXISTS api_keys;
            `);
        }
    }
];

/**
 * 会話履歴データベースのマイグレーション定義
 * 注意: LangGraphのSqliteSaverが管理するテーブルは直接変更しない
 * 追加の機能テーブルのみ定義
 */
export const conversationMigrations: Migration[] = [
    {
        version: 1,
        description: 'Create conversation metadata table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS conversation_metadata (
                    thread_id TEXT PRIMARY KEY,
                    custom_name TEXT,
                    tags TEXT, -- JSON形式でタグを保存
                    is_archived BOOLEAN DEFAULT 0,
                    is_pinned BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS conversation_metadata`);
        }
    },
    {
        version: 2,
        description: 'Add indexes for conversation metadata',
        up: (db) => {
            db.exec(`
                CREATE INDEX IF NOT EXISTS idx_conversation_metadata_archived 
                ON conversation_metadata(is_archived);
                
                CREATE INDEX IF NOT EXISTS idx_conversation_metadata_pinned 
                ON conversation_metadata(is_pinned);
                
                CREATE INDEX IF NOT EXISTS idx_conversation_metadata_created_at 
                ON conversation_metadata(created_at);
            `);
        },
        down: (db) => {
            db.exec(`
                DROP INDEX IF EXISTS idx_conversation_metadata_archived;
                DROP INDEX IF EXISTS idx_conversation_metadata_pinned;
                DROP INDEX IF EXISTS idx_conversation_metadata_created_at;
            `);
        }
    },
    {
        version: 3,
        description: 'Create conversation statistics table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS conversation_statistics (
                    thread_id TEXT PRIMARY KEY,
                    message_count INTEGER DEFAULT 0,
                    total_tokens INTEGER DEFAULT 0,
                    ai_response_count INTEGER DEFAULT 0,
                    user_message_count INTEGER DEFAULT 0,
                    first_message_at DATETIME,
                    last_message_at DATETIME,
                    avg_response_time_ms INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (thread_id) REFERENCES conversation_metadata(thread_id)
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS conversation_statistics`);
        }
    }
];

/**
 * 設定データベースのマイグレーション定義
 */
export const settingsMigrations: Migration[] = [
    {
        version: 1,
        description: 'Create user_settings table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    setting_key TEXT UNIQUE NOT NULL,
                    setting_value TEXT NOT NULL,
                    setting_type TEXT DEFAULT 'string',
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS user_settings`);
        }
    },
    {
        version: 2,
        description: 'Add index on setting_key for user_settings',
        up: (db) => {
            db.exec(`
                CREATE INDEX IF NOT EXISTS idx_user_settings_setting_key 
                ON user_settings(setting_key)
            `);
        },
        down: (db) => {
            db.exec(`DROP INDEX IF EXISTS idx_user_settings_setting_key`);
        }
    },
    {
        version: 3,
        description: 'Create initial_setup table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS initial_setup (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    is_completed BOOLEAN DEFAULT 0,
                    completed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS initial_setup`);
        }
    }
];

/**
 * データベース設定を取得
 */
export function getDatabaseConfigs(): DatabaseConfig[] {
    const userDataPath = app.getPath('userData');

    return [
        {
            name: 'encryption',
            path: path.join(userDataPath, 'encryption.db'),
            migrations: encryptionKeyMigrations
        },
        {
            name: 'apikeys',
            path: path.join(userDataPath, 'apikeys.db'),
            migrations: apiKeyMigrations
        },
        {
            name: 'conversations',
            path: path.join(userDataPath, 'conversations.db'),
            migrations: conversationMigrations
        },
        {
            name: 'settings',
            path: path.join(userDataPath, 'settings.db'),
            migrations: settingsMigrations
        }
    ];
}

/**
 * 開発用のマイグレーション追加例
 * 新機能の追加時に参考にしてください
 */
export const exampleFutureMigrations: Migration[] = [
    {
        version: 4,
        description: 'Add AI model configuration table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS ai_model_configs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_name TEXT UNIQUE NOT NULL,
                    provider TEXT NOT NULL,
                    config_json TEXT NOT NULL, -- JSON形式でモデル設定を保存
                    is_default BOOLEAN DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS ai_model_configs`);
        }
    },
    {
        version: 5,
        description: 'Add user preferences table',
        up: (db) => {
            db.exec(`
                CREATE TABLE IF NOT EXISTS user_preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    preference_key TEXT UNIQUE NOT NULL,
                    preference_value TEXT NOT NULL,
                    preference_type TEXT DEFAULT 'string', -- string, number, boolean, json
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        },
        down: (db) => {
            db.exec(`DROP TABLE IF EXISTS user_preferences`);
        }
    }
];
