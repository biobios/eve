/**
 * IPC処理クラス（レガシー互換性のためのラッパー）
 * @deprecated リファクタリング後の新しいハンドラー構造を使用してください
 * 新しい構造: ./ipc-handlers/IPCHandlerManager
 */

import { AIManager } from './ai-manager';
import { ApiKeyStorage } from './crypto-utils';
import { IPCHandlerManager } from './ipc-handlers/ipc-handler-manager';
import { SessionManager } from './session-manager';
import { WindowManager } from './window-manager';

/**
 * @deprecated 新しい IPCHandlerManager を使用してください
 * このクラスはレガシー互換性のために残されています
 */
export class IPCHandlers {
    private handlerManager: IPCHandlerManager;

    constructor(aiManager: AIManager, sessionManager: SessionManager, apiKeyStorage: ApiKeyStorage, windowManager?: WindowManager) {
        console.warn('[IPCHandlers] This class is deprecated. Please use IPCHandlerManager instead.');
        this.handlerManager = new IPCHandlerManager(aiManager, sessionManager, apiKeyStorage, windowManager);
    }

    /**
     * すべてのIPCハンドラーを設定
     * @deprecated handlerManager.setupAllHandlers() を使用してください
     */
    public setupHandlers(): void {
        console.warn('[IPCHandlers] setupHandlers() is deprecated. Using new handler structure.');
        this.handlerManager.setupAllHandlers();
    }
}
