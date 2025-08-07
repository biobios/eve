/**
 * 暗号化・復号処理のユーティリティ
 * APIキーなどの機密情報を安全に保存するための暗号化機能を提供
 * 
 * @deprecated このファイルはリファクタリングされました。
 * 新しい構造では各機能が独立したファイルに分離されています。
 * 後方互換性のため、このファイルからのエクスポートは引き続き機能します。
 * 
 * 新しいインポート方法:
 * - import { EncryptionKeyManager } from './crypto-utils/encryption-key-manager';
 * - import { DataEncryption } from './crypto-utils/data-encryption';
 * - import { ApiKeyStorage } from './crypto-utils/api-key-storage';
 * 
 * または統合インポート（推奨）:
 * - import { EncryptionKeyManager, DataEncryption, ApiKeyStorage } from './crypto-utils';
 */

// 後方互換性のため、新しい実装をre-export
export { ApiKeyStorage } from './crypto-utils/api-key-storage';
export { DataEncryption } from './crypto-utils/data-encryption';
export { EncryptionKeyManager } from './crypto-utils/encryption-key-manager';

