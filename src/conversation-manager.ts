/**
 * Conversation Manager クラス
 * LangGraphワークフローとメッセージ処理を担当
 */

import { HumanMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIService } from './ai-service';
import { SessionStorage } from './session-storage';

export class ConversationManager {
    private workflow: any = null;
    private aiService: AIService;
    private sessionStorage: SessionStorage;

    constructor(aiService: AIService, sessionStorage: SessionStorage) {
        this.aiService = aiService;
        this.sessionStorage = sessionStorage;
    }

    /**
     * LangGraphワークフローを初期化
     */
    public async initialize(): Promise<boolean> {
        if (!this.aiService.isInitialized() || !this.sessionStorage.isInitialized()) {
            console.error('AIService or SessionStorage not initialized');
            return false;
        }

        try {
            this.workflow = this.createChatWorkflow();
            return true;
        } catch (error) {
            console.error('ConversationManager initialization failed:', error);
            return false;
        }
    }

    /**
     * LangGraphワークフローを作成
     */
    private createChatWorkflow() {
        // チャットノード: AIモデルを呼び出してレスポンスを生成
        const chatNode = async (state: typeof MessagesAnnotation.State) => {
            const chatModel = this.aiService.getChatModel();
            if (!chatModel) {
                throw new Error('Chat model not initialized');
            }

            try {
                const response = await chatModel.invoke(state.messages);
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

        const checkpointer = this.sessionStorage.getCheckpointer();
        if (!checkpointer) {
            throw new Error('Checkpointer not available');
        }

        return graph.compile({ checkpointer: checkpointer });
    }

    /**
     * メッセージを送信してAIレスポンスを取得
     */
    public async sendMessage(message: string, sessionId: string): Promise<string> {
        if (!this.workflow) {
            throw new Error('Conversation workflow not initialized. Please set API key first.');
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
     * ワークフローが初期化済みかチェック
     */
    public isInitialized(): boolean {
        return this.workflow !== null;
    }

    /**
     * ワークフローをリセット
     */
    public reset(): void {
        this.workflow = null;
    }
}
