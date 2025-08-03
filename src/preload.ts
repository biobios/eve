// プリロードスクリプト - フロントエンドにセキュアなAPIを提供
import { contextBridge, ipcRenderer } from 'electron';

// セッション関連の型定義
interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

// フロントエンドに公開するAPIの型定義
interface ElectronAPI {
    // AI チャット関連
    setApiKey: (apiKey: string) => Promise<boolean>;
    sendMessage: (message: string) => Promise<string>;
    clearConversation: () => Promise<boolean>;
    getConversationHistory: (sessionId?: string) => Promise<Array<{ type: 'user' | 'ai', content: string, timestamp: Date }>>;

    // セッション管理
    createSession: () => Promise<ChatSession>;
    switchSession: (sessionId: string) => Promise<boolean>;
    getSessions: () => Promise<ChatSession[]>;
    deleteSession: (sessionId: string) => Promise<boolean>;

    // その他のユーティリティ
    getVersion: () => Promise<string>;
}

// セキュアなAPIをフロントエンドに公開
const electronAPI: ElectronAPI = {
    // API キーを設定
    setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),

    // メッセージを送信
    sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

    // 会話履歴をクリア
    clearConversation: () => ipcRenderer.invoke('clear-conversation'),

    // 会話履歴を取得
    getConversationHistory: (sessionId?: string) => ipcRenderer.invoke('get-conversation-history', sessionId),

    // セッション管理
    createSession: () => ipcRenderer.invoke('create-session'),
    switchSession: (sessionId: string) => ipcRenderer.invoke('switch-session', sessionId),
    getSessions: () => ipcRenderer.invoke('get-sessions'),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('delete-session', sessionId),

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
