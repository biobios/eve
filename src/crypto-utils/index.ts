/**
 * 暗号化・復号処理のユーティリティ
 * APIキーなどの機密情報を安全に保存するための暗号化機能を提供
 * 
 * このモジュールは後方互換性を保ちながら、各機能を独立したファイルに分離しています。
 */

// 各コンポーネントをエクスポート
export { ApiKeyStorage } from './api-key-storage';
export { DataEncryption } from './data-encryption';
export { EncryptionKeyManager } from './encryption-key-manager';

// 型定義のエクスポート（必要に応じて追加）
export type { DatabaseMigrator } from '../database-migration';

/**
 * 後方互換性確保のため、元のcrypto-utils.tsからのインポートはそのまま動作します
 * 
 * 使用例:
 * import { ApiKeyStorage, DataEncryption, EncryptionKeyManager } from './crypto-utils';
 * 
 * または個別インポート:
 * import { ApiKeyStorage } from './crypto-utils/api-key-storage';
 * import { DataEncryption } from './crypto-utils/data-encryption';
 * import { EncryptionKeyManager } from './crypto-utils/encryption-key-manager';
 */
