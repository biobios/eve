// セッション管理機能を担当するクラス

export interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

export interface SessionElements {
    section: HTMLDivElement;
    select: HTMLSelectElement;
    newBtn: HTMLButtonElement;
    deleteBtn: HTMLButtonElement;
}

/**
 * セッション管理機能を担当するクラス
 * セッションの作成、切り替え、削除、UI更新を行う
 */
export class SessionUIManager {
    private elements: SessionElements;
    private sessions: ChatSession[] = [];
    private currentSession: ChatSession | null = null;

    constructor(elements: SessionElements) {
        this.elements = elements;
    }

    /**
     * セッション一覧をロード
     */
    public async loadSessions(): Promise<void> {
        try {
            this.sessions = await (window as any).electronAPI.getSessions();
            this.updateSessionSelect();
        } catch (error) {
            console.error('Load sessions error:', error);
            throw error;
        }
    }

    /**
     * セッション選択UIを更新
     */
    public updateSessionSelect(): void {
        // セッション選択肢をクリア
        this.elements.select.innerHTML = '<option value="">セッションを選択...</option>';

        // 各セッションを追加
        this.sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.id;
            option.textContent = session.name;
            if (this.currentSession && this.currentSession.id === session.id) {
                option.selected = true;
            }
            this.elements.select.appendChild(option);
        });
    }

    /**
     * セッションを切り替え
     * @param sessionId 切り替え先のセッションID
     * @returns 切り替え結果
     */
    public async switchSession(sessionId: string): Promise<{ success: boolean; session?: ChatSession; error?: string }> {
        if (!sessionId) {
            this.currentSession = null;
            return { success: true };
        }

        try {
            const success = await (window as any).electronAPI.switchSession(sessionId);
            if (success) {
                this.currentSession = this.sessions.find(s => s.id === sessionId) || null;
                return {
                    success: true,
                    session: this.currentSession || undefined
                };
            } else {
                return { success: false, error: 'セッションの切り替えに失敗しました' };
            }
        } catch (error) {
            console.error('Session switch error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * 新しいセッションを作成
     * @returns 作成されたセッション
     */
    public async createNewSession(): Promise<{ success: boolean; session?: ChatSession; error?: string }> {
        try {
            const newSession = await (window as any).electronAPI.createSession();
            this.currentSession = newSession;
            this.sessions.push(newSession);
            this.updateSessionSelect();
            return { success: true, session: newSession };
        } catch (error) {
            console.error('New session error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * セッションを削除
     * @param sessionId 削除するセッションID
     * @returns 削除結果
     */
    public async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
        if (!sessionId) {
            return { success: false, error: '削除するセッションを選択してください' };
        }

        try {
            const success = await (window as any).electronAPI.deleteSession(sessionId);
            if (success) {
                // セッション一覧から削除
                this.sessions = this.sessions.filter(s => s.id !== sessionId);

                // 現在のセッションが削除対象の場合はクリア
                if (this.currentSession && this.currentSession.id === sessionId) {
                    this.currentSession = null;
                }

                this.updateSessionSelect();
                return { success: true };
            } else {
                return { success: false, error: 'セッションの削除に失敗しました' };
            }
        } catch (error) {
            console.error('Delete session error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * 現在のセッションを取得
     * @returns 現在のセッション
     */
    public getCurrentSession(): ChatSession | null {
        return this.currentSession;
    }

    /**
     * セッション一覧を取得
     * @returns セッション一覧
     */
    public getSessions(): ChatSession[] {
        return [...this.sessions];
    }

    /**
     * 選択されたセッションIDを取得
     * @returns 選択されたセッションID
     */
    public getSelectedSessionId(): string {
        return this.elements.select.value;
    }

    /**
     * セッションの存在確認
     * @param sessionId セッションID
     * @returns セッションが存在するかどうか
     */
    public hasSession(sessionId: string): boolean {
        return this.sessions.some(s => s.id === sessionId);
    }

    /**
     * セッションを名前で検索
     * @param sessionName セッション名
     * @returns 該当するセッション
     */
    public findSessionByName(sessionName: string): ChatSession | undefined {
        return this.sessions.find(s => s.name === sessionName);
    }

    /**
     * セッション数を取得
     * @returns セッション数
     */
    public getSessionCount(): number {
        return this.sessions.length;
    }

    /**
     * セッションリストを強制更新
     * （外部からセッション一覧が変更された場合に使用）
     */
    public async refreshSessions(): Promise<void> {
        await this.loadSessions();
    }

    /**
     * 現在のセッションをクリア
     */
    public clearCurrentSession(): void {
        this.currentSession = null;
    }

    /**
     * セッション選択要素を取得
     * @returns セッション選択要素
     */
    public getSessionSelect(): HTMLSelectElement {
        return this.elements.select;
    }
}
