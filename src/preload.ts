// プリロードスクリプト - フロントエンドにセキュアなAPIを提供
import { contextBridge, ipcRenderer } from 'electron';

// フロントエンドに公開するAPIの型定義
interface ElectronAPI {
    // AI チャット関連
    setApiKey: (apiKey: string) => Promise<boolean>;
    sendMessage: (message: string) => Promise<string>;

    // その他のユーティリティ
    getVersion: () => Promise<string>;
}

// セキュアなAPIをフロントエンドに公開
const electronAPI: ElectronAPI = {
    // API キーを設定
    setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),

    // メッセージを送信
    sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

    // バージョン情報を取得
    getVersion: () => ipcRenderer.invoke('get-version')
};

// contextBridge を使ってセキュアにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript用の型定義をグローバルに追加
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
