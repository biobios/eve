/**
 * AI管理クラス
 * Google Gemini AIとLangGraphワークフローの初期化・管理を担当
 */

import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { app } from 'electron';
import * as path from 'path';
import { ApiKeyStorage } from './crypto-utils';

export class AIManager {
    private chatModel: ChatGoogleGenerativeAI | null = null;
    private workflow: any = null;
    private checkpointer: SqliteSaver | null = null;
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
            const savedApiKey = this.apiKeyStorage.getApiKey('gemini');
            if (savedApiKey) {
                console.log('Found saved API key, initializing AI...');
                return await this.initialize(savedApiKey);
            }
            return false;
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
            this.chatModel = new ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash",
                apiKey: apiKey
            });

            // SqliteSaverを初期化（アプリのデータディレクトリを使用）
            const dbPath = path.join(app.getPath('userData'), 'conversations.db');
            this.checkpointer = SqliteSaver.fromConnString(dbPath);

            // LangGraphワークフローを作成
            this.workflow = this.createChatWorkflow();

            // APIキーを保存する場合
            if (saveKey && this.apiKeyStorage) {
                this.apiKeyStorage.saveApiKey('gemini', apiKey);
                console.log('API key saved to storage');
            }

            return true;
        } catch (error) {
            console.error('AI initialization failed:', error);
            return false;
        }
    }

    /**
     * LangGraphワークフローを作成
     */
    private createChatWorkflow() {
        // チャットノード: AIモデルを呼び出してレスポンスを生成
        const chatNode = async (state: typeof MessagesAnnotation.State) => {
            if (!this.chatModel) {
                throw new Error('Chat model not initialized');
            }

            try {
                const response = await this.chatModel.invoke(state.messages);
                return { messages: [response] };
            } catch (error) {
                console.error('Chat node error:', error);
                throw error;
            }
        };

        // StateGraphを作成（checkpointerを設定）
        const graph = new StateGraph(MessagesAnnotation)
            .addNode("chat", chatNode)
            .addEdge("__start__", "chat")
            .addEdge("chat", "__end__");

        return graph.compile({ checkpointer: this.checkpointer! });
    }

    /**
     * メッセージを送信してAIレスポンスを取得
     */
    public async sendMessage(message: string, sessionId: string): Promise<string> {
        if (!this.workflow) {
            throw new Error('AI workflow not initialized. Please set API key first.');
        }

        try {
            // HumanMessageを作成
            const humanMessage = new HumanMessage({ content: message });

            // LangGraphワークフローを実行（SessionIDをthreadIdとして使用）
            const result = await this.workflow.invoke(
                { messages: [humanMessage] },
                { configurable: { thread_id: sessionId } }
            );

            // 最後のメッセージ（AIの応答）を取得
            const lastMessage = result.messages[result.messages.length - 1];

            return lastMessage.content;
        } catch (error) {
            console.error('AI chat error:', error);
            throw error;
        }
    }

    /**
     * 会話履歴を取得
     */
    public async getConversationHistory(sessionId: string): Promise<any[]> {
        if (!this.workflow || !this.checkpointer) {
            return [];
        }

        try {
            // checkpointerから会話履歴を取得
            const checkpoint = await this.checkpointer.get({ configurable: { thread_id: sessionId } });

            if (checkpoint && checkpoint.channel_values && checkpoint.channel_values.messages) {
                const messages = checkpoint.channel_values.messages;
                if (Array.isArray(messages)) {
                    return messages.map((msg: any) => ({
                        type: msg._getType() === 'human' ? 'user' : 'ai',
                        content: msg.content,
                        timestamp: new Date() // 実際のタイムスタンプの実装は追加できます
                    }));
                }
            }

            return [];
        } catch (error) {
            console.error('Get conversation history error:', error);
            return [];
        }
    }

    /**
     * セッションを削除
     */
    public async deleteSession(sessionId: string): Promise<boolean> {
        try {
            // SQLiteからセッションデータを永久削除
            if (this.checkpointer) {
                await this.checkpointer.deleteThread(sessionId);
            }
            return true;
        } catch (error) {
            console.error('Delete session error:', error);
            return false;
        }
    }

    /**
     * 全セッションの情報を取得
     */
    public async getAllSessions(): Promise<any[]> {
        if (!this.checkpointer) {
            return [];
        }

        try {
            const sessions: any[] = [];
            const checkpoints = await this.checkpointer.list({});
            const seenThreadIds = new Set<string>();

            for await (const checkpoint of checkpoints) {
                if (checkpoint.config && checkpoint.config.configurable && checkpoint.config.configurable.thread_id) {
                    const sessionId = checkpoint.config.configurable.thread_id;

                    // 重複を避ける
                    if (seenThreadIds.has(sessionId)) {
                        continue;
                    }
                    seenThreadIds.add(sessionId);

                    // 会話履歴を取得してセッション名を決定
                    let sessionName = '新しい会話';
                    try {
                        const fullCheckpoint = await this.checkpointer.get({ configurable: { thread_id: sessionId } });
                        if (fullCheckpoint && fullCheckpoint.channel_values && fullCheckpoint.channel_values.messages) {
                            const messages = fullCheckpoint.channel_values.messages;
                            if (Array.isArray(messages) && messages.length > 0) {
                                // 最初のユーザーメッセージを探す
                                const firstUserMessage = messages.find((msg: any) => msg._getType() === 'human');
                                if (firstUserMessage && firstUserMessage.content) {
                                    // 最初の30文字を取得（改行や余分な空白を除去）
                                    const content = firstUserMessage.content.replace(/\s+/g, ' ').trim();
                                    sessionName = content.length > 30 ? content.substring(0, 30) + '...' : content;
                                }
                            }
                        }
                    } catch (err) {
                        // エラーが発生した場合は、デフォルトの名前を使用
                        console.warn('Failed to get session name for', sessionId, err);
                    }

                    // セッション情報を構築
                    const session = {
                        id: sessionId,
                        name: sessionName,
                        createdAt: new Date(),
                        lastMessageAt: new Date()
                    };

                    sessions.push(session);
                }
            }

            return sessions;
        } catch (error) {
            console.error('Get sessions error:', error);
            return [];
        }
    }

    /**
     * AIが初期化済みかチェック
     */
    public isInitialized(): boolean {
        return this.workflow !== null && this.chatModel !== null;
    }

    /**
     * checkpointerインスタンスを取得（外部でのアクセス用）
     */
    public getCheckpointer(): SqliteSaver | null {
        return this.checkpointer;
    }
}
