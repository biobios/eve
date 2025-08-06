// プリロードスクリプト - フロントエンドにセキュアなAPIを提供
import { contextBridge, ipcRenderer } from 'electron';

// セッション関連の型定義（session-storage.tsのSessionInfoと一致させる）
interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

// フロントエンドに公開するAPIの型定義
interface ElectronAPI {
    // AI チャット関連
    setApiKey: (apiKey: string, saveKey?: boolean) => Promise<boolean>;
    sendMessage: (message: string) => Promise<string>;
    clearConversation: () => Promise<boolean>;
    getConversationHistory: (sessionId?: string) => Promise<Array<{ type: 'user' | 'ai', content: string, timestamp: Date }>>;

    // API キー管理
    hasSavedApiKey: () => Promise<boolean>;
    deleteSavedApiKey: () => Promise<boolean>;
    isAiInitialized: () => Promise<boolean>;

    // セッション管理
    createSession: () => Promise<ChatSession>;
    switchSession: (sessionId: string) => Promise<boolean>;
    getSessions: () => Promise<ChatSession[]>;
    deleteSession: (sessionId: string) => Promise<boolean>;

    // データベース管理
    getDatabaseStatus: () => Promise<any>;
    databaseHealthCheck: () => Promise<any>;
    createDatabaseBackup: () => Promise<any>;
    forceMigration: () => Promise<any>;

    // イベントリスナー
    onAiInitialized: (callback: (initialized: boolean) => void) => () => void;

    // その他のユーティリティ
    getVersion: () => Promise<string>;
}

// セキュアなAPIをフロントエンドに公開
const electronAPI: ElectronAPI = {
    // API キーを設定（保存オプション付き）
    setApiKey: (apiKey: string, saveKey: boolean = false) => ipcRenderer.invoke('set-api-key', apiKey, saveKey),

    // メッセージを送信
    sendMessage: (message: string) => ipcRenderer.invoke('send-message', message),

    // 会話履歴をクリア
    clearConversation: () => ipcRenderer.invoke('clear-conversation'),

    // 会話履歴を取得
    getConversationHistory: (sessionId?: string) => ipcRenderer.invoke('get-conversation-history', sessionId),

    // API キー管理
    hasSavedApiKey: () => ipcRenderer.invoke('has-saved-api-key'),
    deleteSavedApiKey: () => ipcRenderer.invoke('delete-saved-api-key'),
    isAiInitialized: () => ipcRenderer.invoke('is-ai-initialized'),

    // セッション管理
    createSession: () => ipcRenderer.invoke('create-session'),
    switchSession: (sessionId: string) => ipcRenderer.invoke('switch-session', sessionId),
    getSessions: () => ipcRenderer.invoke('get-sessions'),
    deleteSession: (sessionId: string) => ipcRenderer.invoke('delete-session', sessionId),

    // データベース管理
    getDatabaseStatus: () => ipcRenderer.invoke('get-database-status'),
    databaseHealthCheck: () => ipcRenderer.invoke('database-health-check'),
    createDatabaseBackup: () => ipcRenderer.invoke('create-database-backup'),
    forceMigration: () => ipcRenderer.invoke('force-migration'),

    // イベントリスナー
    onAiInitialized: (callback: (initialized: boolean) => void) => {
        const listener = (_event: any, initialized: boolean) => callback(initialized);
        ipcRenderer.on('ai-initialized', listener);

        // クリーンアップ関数を返す
        return () => {
            ipcRenderer.removeListener('ai-initialized', listener);
        };
    },

    // バージョン情報を取得
    getVersion: () => ipcRenderer.invoke('get-version')
};

// contextBridge を使ってセキュアにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
