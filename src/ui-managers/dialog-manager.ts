// 確認ダイアログの管理を担当するクラス

export interface ConfirmDialogElements {
    modal: HTMLDivElement;
    title: HTMLHeadingElement;
    message: HTMLParagraphElement;
    okBtn: HTMLButtonElement;
    cancelBtn: HTMLButtonElement;
}

/**
 * 確認ダイアログの表示と管理を担当するクラス
 * ユーザーからの確認を必要とする操作のダイアログを制御
 */
export class DialogManager {
    private elements: ConfirmDialogElements;
    private confirmCallback: ((result: boolean) => void) | null = null;

    constructor(elements: ConfirmDialogElements) {
        this.elements = elements;
    }

    /**
     * 確認ダイアログを表示
     * @param title ダイアログのタイトル
     * @param message 確認メッセージ
     * @returns ユーザーの選択結果（true: OK, false: キャンセル）
     */
    public showConfirmDialog(title: string, message: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.confirmCallback = resolve;
            this.elements.title.textContent = title;
            this.elements.message.textContent = message;
            this.elements.modal.classList.add('show');
        });
    }

    /**
     * 確認ダイアログの結果を処理
     * @param result ユーザーの選択結果
     */
    public handleConfirmDialog(result: boolean): void {
        this.elements.modal.classList.remove('show');
        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }

    /**
     * ダイアログが現在表示されているかチェック
     * @returns 表示されている場合はtrue
     */
    public isDialogVisible(): boolean {
        return this.elements.modal.classList.contains('show');
    }

    /**
     * ダイアログを強制的に閉じる
     */
    public closeDialog(): void {
        this.handleConfirmDialog(false);
    }

    /**
     * 削除確認ダイアログの便利メソッド
     * @param itemName 削除対象の名前
     * @returns ユーザーの選択結果
     */
    public showDeleteConfirmDialog(itemName: string): Promise<boolean> {
        return this.showConfirmDialog(
            `${itemName}の削除`,
            `${itemName}を削除しますか？この操作は取り消せません。`
        );
    }

    /**
     * クリア確認ダイアログの便利メソッド
     * @param itemName クリア対象の名前
     * @returns ユーザーの選択結果
     */
    public showClearConfirmDialog(itemName: string): Promise<boolean> {
        return this.showConfirmDialog(
            `${itemName}クリア`,
            `${itemName}をクリアしてもよろしいですか？この操作は取り消せません。`
        );
    }
}
