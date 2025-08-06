/**
 * AI Service クラス
 * Google Gemini AI の初期化と管理を担当
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ApiKeyStorage } from './crypto-utils';

export class AIService {
    private chatModel: ChatGoogleGenerativeAI | null = null;
    private apiKeyStorage: ApiKeyStorage | null = null;

    constructor(apiKeyStorage: ApiKeyStorage) {
        this.apiKeyStorage = apiKeyStorage;
    }

    /**
     * 保存されたAPIキーを使用してAIを初期化
     */
    public async initializeFromStorage(): Promise<boolean> {
        if (!this.apiKeyStorage) {
            return false;
        }

        try {
            const savedApiKeyInfo = await this.apiKeyStorage.getApiKeyInfo('gemini');
            if (savedApiKeyInfo) {
                console.log('Found saved API key, initializing AI...');
                return await this.initialize(savedApiKeyInfo.apiKey, false, savedApiKeyInfo.aiModel);
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize AI from storage:', error);
            return false;
        }
    }

    /**
     * APIキーを設定してAIモデルを初期化
     */
    public async initialize(apiKey: string, saveKey: boolean = false, model: string = "gemini-1.5-flash"): Promise<boolean> {
        try {
            this.chatModel = new ChatGoogleGenerativeAI({
                model: model,
                apiKey: apiKey
            });

            // APIキーを保存する場合
            if (saveKey && this.apiKeyStorage) {
                await this.apiKeyStorage.saveApiKey('gemini', apiKey, model);
                console.log('API key saved to storage');
            }

            return true;
        } catch (error) {
            console.error('AI initialization failed:', error);
            return false;
        }
    }

    /**
     * AIが初期化済みかチェック
     */
    public isInitialized(): boolean {
        return this.chatModel !== null;
    }

    /**
     * チャットモデルを取得
     */
    public getChatModel(): ChatGoogleGenerativeAI | null {
        return this.chatModel;
    }

    /**
     * AIモデルをリセット
     */
    public reset(): void {
        this.chatModel = null;
    }
}
