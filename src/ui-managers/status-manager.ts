// ステータス表示管理を担当するクラス

export type StatusType = '' | 'connected' | 'error';

/**
 * アプリケーションのステータス表示を管理するクラス
 * ユーザーへのフィードバック表示を担当
 */
export class StatusManager {
    private statusElement: HTMLDivElement;

    constructor(statusElement: HTMLDivElement) {
        this.statusElement = statusElement;
    }

    /**
     * ステータスメッセージを表示
     * @param message 表示するメッセージ
     * @param type ステータスの種類（通常、接続完了、エラー）
     */
    public showStatus(message: string, type: StatusType = ''): void {
        this.statusElement.textContent = message;
        this.statusElement.className = `status ${type}`;
    }

    /**
     * 接続完了ステータスを表示
     * @param message 表示するメッセージ
     */
    public showConnectedStatus(message: string): void {
        this.showStatus(message, 'connected');
    }

    /**
     * エラーステータスを表示
     * @param message 表示するメッセージ
     */
    public showErrorStatus(message: string): void {
        this.showStatus(message, 'error');
    }

    /**
     * ステータスをクリア
     */
    public clearStatus(): void {
        this.showStatus('');
    }

    /**
     * 一時的なステータスメッセージを表示（指定時間後に自動消去）
     * @param message 表示するメッセージ
     * @param type ステータスの種類
     * @param duration 表示時間（ミリ秒）
     */
    public showTemporaryStatus(message: string, type: StatusType = '', duration: number = 3000): void {
        this.showStatus(message, type);
        setTimeout(() => {
            this.clearStatus();
        }, duration);
    }
}
