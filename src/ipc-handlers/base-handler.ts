/**
 * IPC基底ハンドラークラス
 * 共通機能とインターフェースを提供
 */


export abstract class BaseHandler {
    /**
     * ハンドラーを登録する抽象メソッド
     * 各派生クラスで実装する
     */
    abstract setupHandlers(): void;

    /**
     * エラーレスポンスの標準化
     */
    protected createErrorResponse(error: unknown, defaultMessage: string = 'Unknown error') {
        return {
            success: false,
            error: error instanceof Error ? error.message : defaultMessage
        };
    }

    /**
     * 成功レスポンスの標準化
     */
    protected createSuccessResponse(data?: any) {
        return {
            success: true,
            ...data
        };
    }

    /**
     * ログ出力のヘルパー
     */
    protected log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
        const prefix = `[${this.constructor.name}]`;
        switch (level) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            default:
                console.log(prefix, message);
        }
    }
}
