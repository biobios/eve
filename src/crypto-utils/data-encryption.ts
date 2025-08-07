/**
 * データ暗号化・復号化のユーティリティクラス
 * crypto-js AESを使用してデータを暗号化・復号化
 */

import * as CryptoJS from 'crypto-js';

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
