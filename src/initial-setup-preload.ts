// 初期設定画面用プリロードスクリプト
import { contextBridge, ipcRenderer } from 'electron';

// 初期設定画面用のAPIの型定義
interface InitialSetupElectronAPI {
    saveInitialSetup: (config: {
        userName: string;
        aiService: string;
        aiModel: string;
        apiKey: string;
    }) => Promise<{ success: boolean; error?: string; apiKeyId?: number }>;
}

// セキュアなAPIをフロントエンドに公開
const electronAPI: InitialSetupElectronAPI = {
    // 初期設定を保存
    saveInitialSetup: (config) => ipcRenderer.invoke('save-initial-setup', config)
};

// contextBridge を使ってセキュアにAPIを公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
