/**
 * セッション管理クラス
 * チャットセッションの作成、切り替え、削除を管理
 */

import { v4 as uuidv4 } from 'uuid';

// セッション管理用の型定義
export interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

export class SessionManager {
    private currentSessionId: string | null = null;

    /**
     * 新しいセッションを作成
     */
    public createSession(): ChatSession {
        try {
            const sessionId = uuidv4();
            this.currentSessionId = sessionId;

            const session: ChatSession = {
                id: sessionId,
                name: '新しい会話',
                createdAt: new Date(),
                lastMessageAt: new Date()
            };

            return session;
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    /**
     * セッションを切り替え
     */
    public switchSession(sessionId: string): boolean {
        try {
            this.currentSessionId = sessionId;
            return true;
        } catch (error) {
            console.error('Session switch error:', error);
            throw error;
        }
    }

    /**
     * 現在のセッションIDを取得
     */
    public getCurrentSessionId(): string | null {
        return this.currentSessionId;
    }

    /**
     * セッションIDを設定
     */
    public setCurrentSessionId(sessionId: string | null): void {
        this.currentSessionId = sessionId;
    }

    /**
     * 現在のセッションをクリア
     */
    public clearCurrentSession(): void {
        this.currentSessionId = null;
    }

    /**
     * セッションが存在するかチェック
     */
    public hasCurrentSession(): boolean {
        return this.currentSessionId !== null;
    }
}
