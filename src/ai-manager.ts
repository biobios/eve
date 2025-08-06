/**
 * AI管理クラス
 * 各コンポーネントを統合してAI機能を提供する薄いラッパー
 */

import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { AIService } from './ai-service';
import { ConversationManager } from './conversation-manager';
import { ApiKeyStorage } from './crypto-utils';
import { SessionInfo, SessionStorage } from './session-storage';

export class AIManager {
    private aiService: AIService;
    private sessionStorage: SessionStorage;
    private conversationManager: ConversationManager;

    constructor(apiKeyStorage: ApiKeyStorage) {
        this.aiService = new AIService(apiKeyStorage);
        this.sessionStorage = new SessionStorage();
        this.conversationManager = new ConversationManager(this.aiService, this.sessionStorage);
    }

    /**
     * 保存されたAPIキーを使用してAIを初期化
     */
    public async initializeFromStorage(): Promise<boolean> {
        try {
            // AIサービスの初期化
            const aiInitialized = await this.aiService.initializeFromStorage();
            if (!aiInitialized) {
                return false;
            }

            // セッションストレージの初期化
            const sessionInitialized = await this.sessionStorage.initialize();
            if (!sessionInitialized) {
                return false;
            }

            // 会話マネージャーの初期化
            const conversationInitialized = await this.conversationManager.initialize();
            return conversationInitialized;
        } catch (error) {
            console.error('Failed to initialize AI from storage:', error);
            return false;
        }
    }

    /**
     * APIキーを設定してLangGraphワークフローを初期化
     */
    public async initialize(apiKey: string, saveKey: boolean = false): Promise<boolean> {
        try {
            // AIサービスの初期化
            const aiInitialized = await this.aiService.initialize(apiKey, saveKey);
            if (!aiInitialized) {
                return false;
            }

            // セッションストレージの初期化
            const sessionInitialized = await this.sessionStorage.initialize();
            if (!sessionInitialized) {
                return false;
            }

            // 会話マネージャーの初期化
            const conversationInitialized = await this.conversationManager.initialize();
            return conversationInitialized;
        } catch (error) {
            console.error('AI initialization failed:', error);
            return false;
        }
    }

    /**
     * メッセージを送信してAIレスポンスを取得
     */
    public async sendMessage(message: string, sessionId: string): Promise<string> {
        return await this.conversationManager.sendMessage(message, sessionId);
    }

    /**
     * 会話履歴を取得
     */
    public async getConversationHistory(sessionId: string): Promise<any[]> {
        return await this.sessionStorage.getConversationHistory(sessionId);
    }

    /**
     * セッションを削除
     */
    public async deleteSession(sessionId: string): Promise<boolean> {
        return await this.sessionStorage.deleteSession(sessionId);
    }

    /**
     * 全セッションの情報を取得
     */
    public async getAllSessions(): Promise<SessionInfo[]> {
        return await this.sessionStorage.getAllSessions();
    }

    /**
     * AIが初期化済みかチェック
     */
    public isInitialized(): boolean {
        return this.aiService.isInitialized() &&
            this.sessionStorage.isInitialized() &&
            this.conversationManager.isInitialized();
    }

    /**
     * checkpointerインスタンスを取得（外部でのアクセス用）
     */
    public getCheckpointer(): SqliteSaver | null {
        return this.sessionStorage.getCheckpointer();
    }
}
