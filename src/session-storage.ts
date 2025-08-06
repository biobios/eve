/**
 * Session Storage クラス
 * セッション管理とSQLite操作を担当
 */

import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { app } from 'electron';
import * as path from 'path';
import { DatabaseMigrator } from './database-migration';
import { conversationMigrations } from './database-migrations-config';

export interface SessionInfo {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

export class SessionStorage {
    private checkpointer: SqliteSaver | null = null;
    private migrator: DatabaseMigrator | null = null;

    /**
     * SQLiteチェックポインターを初期化
     */
    public async initialize(): Promise<boolean> {
        try {
            // マイグレーションを実行
            await this.runMigrations();

            // SqliteSaverを初期化（アプリのデータディレクトリを使用）
            const dbPath = path.join(app.getPath('userData'), 'conversations.db');
            this.checkpointer = SqliteSaver.fromConnString(dbPath);
            return true;
        } catch (error) {
            console.error('SessionStorage initialization failed:', error);
            return false;
        }
    }

    /**
     * マイグレーションを実行
     */
    private async runMigrations(): Promise<void> {
        if (!this.migrator) {
            const dbPath = path.join(app.getPath('userData'), 'conversations.db');
            this.migrator = new DatabaseMigrator({
                name: 'conversations',
                path: dbPath,
                migrations: conversationMigrations
            });
        }

        const result = await this.migrator.migrate();
        if (!result.success) {
            console.error('Conversations database migration failed:', result.errors);
            throw new Error('Failed to migrate conversations database');
        }
    }

    /**
     * 会話履歴を取得
     */
    public async getConversationHistory(sessionId: string): Promise<any[]> {
        if (!this.checkpointer) {
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
    public async getAllSessions(): Promise<SessionInfo[]> {
        if (!this.checkpointer) {
            return [];
        }

        try {
            const sessions: SessionInfo[] = [];
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
                    const session: SessionInfo = {
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
     * checkpointerインスタンスを取得（外部でのアクセス用）
     */
    public getCheckpointer(): SqliteSaver | null {
        return this.checkpointer;
    }

    /**
     * 初期化済みかチェック
     */
    public isInitialized(): boolean {
        return this.checkpointer !== null;
    }

    /**
     * マイグレーションステータスを取得
     */
    public async getMigrationStatus(): Promise<ReturnType<DatabaseMigrator['getStatus']> | null> {
        if (!this.migrator) {
            await this.runMigrations();
        }
        return this.migrator?.getStatus() || null;
    }

    /**
     * データベース接続を閉じる
     */
    public close(): void {
        if (this.migrator) {
            this.migrator.close();
            this.migrator = null;
        }
        this.checkpointer = null;
    }
}
