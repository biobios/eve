// セッション管理機能を担当するクラス

export interface ChatSession {
    id: string;
    name: string;
    createdAt: Date;
    lastMessageAt: Date;
}

export interface SessionElements {
    section: HTMLDivElement;
    list: HTMLUListElement;
    newBtn: HTMLButtonElement;
    contextMenu: HTMLDivElement;
    deleteMenuItem: HTMLDivElement;
}

/**
 * セッション管理機能を担当するクラス
 * セッションの作成、切り替え、削除、UI更新を行う
 */
export class SessionUIManager {
    private elements: SessionElements;
    private sessions: ChatSession[] = [];
    private currentSession: ChatSession | null = null;
    private selectedSessionElement: HTMLLIElement | null = null;
    private onSessionClickCallback?: (sessionId: string) => Promise<void>;

    constructor(elements: SessionElements) {
        this.elements = elements;
        this.setupContextMenu();
    }

    /**
     * セッションクリックのコールバックを設定
     */
    public setOnSessionClickCallback(callback: (sessionId: string) => Promise<void>): void {
        this.onSessionClickCallback = callback;
    }

    /**
     * 右クリックメニューの設定
     */
    private setupContextMenu(): void {
        // 右クリックメニューを隠すためのイベント
        document.addEventListener('click', (e) => {
            if (!this.elements.contextMenu.contains(e.target as Node)) {
                this.hideContextMenu();
            }
        });

        // ESCキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    /**
     * セッション一覧をロード
     */
    public async loadSessions(): Promise<void> {
        try {
            this.sessions = await (window as any).electronAPI.getSessions();
            this.updateSessionList();
        } catch (error) {
            console.error('Load sessions error:', error);
            throw error;
        }
    }

    /**
     * セッション一覧UIを更新
     */
    public updateSessionList(): void {
        // セッション一覧をクリア
        this.elements.list.innerHTML = '';

        if (this.sessions.length === 0) {
            // セッションがない場合のメッセージ
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-session-message';
            emptyMessage.textContent = 'セッションがありません';
            this.elements.list.appendChild(emptyMessage);
            return;
        }

        // 各セッションを追加
        this.sessions.forEach(session => {
            const listItem = this.createSessionItem(session);
            this.elements.list.appendChild(listItem);
        });
    }

    /**
     * セッションアイテムを作成
     */
    private createSessionItem(session: ChatSession): HTMLLIElement {
        const listItem = document.createElement('li');
        listItem.className = 'session-item';
        listItem.dataset.sessionId = session.id;

        // 現在のセッションの場合はアクティブクラスを追加
        if (this.currentSession && this.currentSession.id === session.id) {
            listItem.classList.add('active');
        }

        // セッション名
        const nameSpan = document.createElement('span');
        nameSpan.className = 'session-name';
        nameSpan.textContent = session.name;

        // 最終メッセージ日時
        const dateSpan = document.createElement('span');
        dateSpan.className = 'session-date';
        dateSpan.textContent = this.formatDate(session.lastMessageAt);

        listItem.appendChild(nameSpan);
        listItem.appendChild(dateSpan);

        // クリックイベント
        listItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectSession(listItem, session);
        });

        // 右クリックイベント
        listItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, session);
        });

        return listItem;
    }

    /**
     * セッションを選択
     */
    private async selectSession(listItem: HTMLLIElement, session: ChatSession): Promise<void> {
        // 前の選択を解除
        if (this.selectedSessionElement) {
            this.selectedSessionElement.classList.remove('active');
        }

        // 新しい選択を設定
        listItem.classList.add('active');
        this.selectedSessionElement = listItem;
        this.currentSession = session;

        // コールバックが設定されている場合は呼び出し
        if (this.onSessionClickCallback) {
            await this.onSessionClickCallback(session.id);
        }
    }

    /**
     * 右クリックメニューを表示
     */
    private showContextMenu(e: MouseEvent, session: ChatSession): void {
        this.elements.contextMenu.style.left = `${e.pageX}px`;
        this.elements.contextMenu.style.top = `${e.pageY}px`;
        this.elements.contextMenu.style.display = 'block';
        this.elements.contextMenu.dataset.sessionId = session.id;
    }

    /**
     * 右クリックメニューを隠す
     */
    private hideContextMenu(): void {
        this.elements.contextMenu.style.display = 'none';
        delete this.elements.contextMenu.dataset.sessionId;
    }

    /**
     * 日付をフォーマット
     */
    private formatDate(date: Date): string {
        const now = new Date();
        const messageDate = new Date(date);
        const diffTime = now.getTime() - messageDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return messageDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return '昨日';
        } else if (diffDays < 7) {
            return `${diffDays}日前`;
        } else {
            return messageDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        }
    }

    /**
     * セッションを切り替え
     * @param sessionId 切り替え先のセッションID
     * @returns 切り替え結果
     */
    public async switchSession(sessionId: string): Promise<{ success: boolean; session?: ChatSession; error?: string }> {
        if (!sessionId) {
            this.currentSession = null;
            this.clearActiveSession();
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
     * アクティブセッションの表示をクリア
     */
    private clearActiveSession(): void {
        if (this.selectedSessionElement) {
            this.selectedSessionElement.classList.remove('active');
            this.selectedSessionElement = null;
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
            this.updateSessionList();
            return { success: true, session: newSession };
        } catch (error) {
            console.error('New session error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    /**
     * セッションを削除
     * @param sessionId 削除するセッションID（省略時は右クリックメニューから取得）
     * @returns 削除結果（削除されたセッションIDを含む）
     */
    public async deleteSession(sessionId?: string): Promise<{ success: boolean; deletedSessionId?: string; error?: string }> {
        const targetSessionId = sessionId || this.elements.contextMenu.dataset.sessionId;

        if (!targetSessionId) {
            return { success: false, error: '削除するセッションを選択してください' };
        }

        try {
            const success = await (window as any).electronAPI.deleteSession(targetSessionId);
            if (success) {
                // セッション一覧から削除
                this.sessions = this.sessions.filter(s => s.id !== targetSessionId);

                // 現在のセッションが削除対象の場合はクリア
                if (this.currentSession && this.currentSession.id === targetSessionId) {
                    this.currentSession = null;
                    this.clearActiveSession();
                }

                this.updateSessionList();
                this.hideContextMenu();
                return { success: true, deletedSessionId: targetSessionId };
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
        return this.currentSession ? this.currentSession.id : '';
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
        this.clearActiveSession();
    }

    /**
     * セッションリスト要素を取得
     * @returns セッションリスト要素
     */
    public getSessionList(): HTMLUListElement {
        return this.elements.list;
    }

    /**
     * 右クリックメニューを取得
     * @returns 右クリックメニュー要素
     */
    public getContextMenu(): HTMLDivElement {
        return this.elements.contextMenu;
    }
}
