/**
 * IPCハンドラーの統合管理クラス
 * 各機能別ハンドラーを統合し、システム全体のIPC通信を管理
 */

import { AIManager } from '../ai-manager';
import { ApiKeyStorage } from '../crypto-utils';
import { SessionManager } from '../session-manager';
import { WindowManager } from '../window-manager';
import { ApiKeyHandler } from './api-key-handler';
import { BaseHandler } from './base-handler';
import { ChatHandler } from './chat-handler';
import { DatabaseHandler } from './database-handler';
import { InitialSetupHandler } from './initial-setup-handler';
import { SessionHandler } from './session-handler';
import { UtilityHandler } from './utility-handler';

export class IPCHandlerManager {
    private handlers: BaseHandler[] = [];

    constructor(
        aiManager: AIManager,
        sessionManager: SessionManager,
        apiKeyStorage: ApiKeyStorage,
        windowManager?: WindowManager
    ) {
        // 各機能別ハンドラーを初期化
        this.handlers = [
            new ApiKeyHandler(aiManager, apiKeyStorage),
            new SessionHandler(aiManager, sessionManager),
            new ChatHandler(aiManager, sessionManager),
            new DatabaseHandler(),
            new InitialSetupHandler(apiKeyStorage, windowManager),
            new UtilityHandler()
        ];
    }

    /**
     * すべてのIPCハンドラーを設定
     */
    public setupAllHandlers(): void {
        console.log('[IPCHandlerManager] Setting up all IPC handlers...');

        for (const handler of this.handlers) {
            try {
                handler.setupHandlers();
                console.log(`[IPCHandlerManager] Successfully set up ${handler.constructor.name}`);
            } catch (error) {
                console.error(`[IPCHandlerManager] Failed to set up ${handler.constructor.name}:`, error);
            }
        }

        console.log(`[IPCHandlerManager] All ${this.handlers.length} handlers set up successfully`);
    }

    /**
     * 特定のハンドラーを取得（デバッグ用）
     */
    public getHandler<T extends BaseHandler>(handlerClass: new (...args: any[]) => T): T | undefined {
        return this.handlers.find(handler => handler instanceof handlerClass) as T;
    }

    /**
     * 設定済みハンドラーの一覧を取得（デバッグ用）
     */
    public getHandlerNames(): string[] {
        return this.handlers.map(handler => handler.constructor.name);
    }
}
