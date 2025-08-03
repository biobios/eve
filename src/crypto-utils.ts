/**
 * 暗号化・復号処理のユーティリティ
 * APIキーなどの機密情報を安全に保存するための暗号化機能を提供
 */

import * as CryptoJS from 'crypto-js';
import { app, safeStorage } from 'electron';
import Database from 'better-sqlite3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 暗号化キーの管理クラス
export class EncryptionKeyManager {
  private static dbPath = path.join(app.getPath('userData'), 'encryption.db');
  private static db: Database.Database | null = null;

  /**
   * データベースを初期化
   */
  private static initDatabase(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      
      // テーブルが存在しない場合は作成
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS encryption_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key_name TEXT UNIQUE NOT NULL,
          encrypted_key BLOB NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    return this.db;
  }

  /**
   * 暗号化キーを生成またはロードする
   * @param keyName キーの名前（識別子）
   * @returns 暗号化キー（Base64エンコード済み）
   */
  public static async getOrCreateEncryptionKey(keyName: string = 'master'): Promise<string> {
    const db = this.initDatabase();
    
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
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// データ暗号化・復号化のユーティリティクラス
export class DataEncryption {
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * データを暗号化する
   * @param data 暗号化するデータ
   * @returns 暗号化されたデータ（Base64エンコード済み）
   */
  public encrypt(data: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    return encrypted;
  }

  /**
   * データを復号化する
   * @param encryptedData 暗号化されたデータ（Base64エンコード済み）
   * @returns 復号化されたデータ
   */
  public decrypt(encryptedData: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

// APIキーストレージクラス
export class ApiKeyStorage {
  private static dbPath = path.join(app.getPath('userData'), 'apikeys.db');
  private static db: Database.Database | null = null;
  private dataEncryption: DataEncryption;

  constructor(dataEncryption: DataEncryption) {
    this.dataEncryption = dataEncryption;
    this.initDatabase();
  }

  /**
   * データベースを初期化
   */
  private initDatabase(): void {
    if (!ApiKeyStorage.db) {
      ApiKeyStorage.db = new Database(ApiKeyStorage.dbPath);
      
      // テーブルが存在しない場合は作成
      ApiKeyStorage.db.exec(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          service_name TEXT UNIQUE NOT NULL,
          encrypted_api_key TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  }

  /**
   * APIキーを保存する
   * @param serviceName サービス名（例: 'gemini'）
   * @param apiKey APIキー
   */
  public saveApiKey(serviceName: string, apiKey: string): void {
    if (!ApiKeyStorage.db) {
      throw new Error('Database not initialized');
    }

    const encryptedKey = this.dataEncryption.encrypt(apiKey);
    
    const upsertStmt = ApiKeyStorage.db.prepare(`
      INSERT INTO api_keys (service_name, encrypted_api_key, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(service_name) DO UPDATE SET
        encrypted_api_key = excluded.encrypted_api_key,
        updated_at = excluded.updated_at
    `);
    
    upsertStmt.run(serviceName, encryptedKey);
  }

  /**
   * APIキーを取得する
   * @param serviceName サービス名（例: 'gemini'）
   * @returns APIキー（復号化済み）、見つからない場合はnull
   */
  public getApiKey(serviceName: string): string | null {
    if (!ApiKeyStorage.db) {
      throw new Error('Database not initialized');
    }

    const selectStmt = ApiKeyStorage.db.prepare('SELECT encrypted_api_key FROM api_keys WHERE service_name = ?');
    const result = selectStmt.get(serviceName) as { encrypted_api_key: string } | undefined;

    if (result) {
      try {
        return this.dataEncryption.decrypt(result.encrypted_api_key);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * APIキーを削除する
   * @param serviceName サービス名（例: 'gemini'）
   */
  public deleteApiKey(serviceName: string): void {
    if (!ApiKeyStorage.db) {
      throw new Error('Database not initialized');
    }

    const deleteStmt = ApiKeyStorage.db.prepare('DELETE FROM api_keys WHERE service_name = ?');
    deleteStmt.run(serviceName);
  }

  /**
   * 保存されているすべてのサービス名を取得する
   * @returns サービス名の配列
   */
  public getStoredServices(): string[] {
    if (!ApiKeyStorage.db) {
      throw new Error('Database not initialized');
    }

    const selectStmt = ApiKeyStorage.db.prepare('SELECT service_name FROM api_keys ORDER BY service_name');
    const results = selectStmt.all() as { service_name: string }[];
    
    return results.map(row => row.service_name);
  }

  /**
   * データベース接続を閉じる
   */
  public static closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
