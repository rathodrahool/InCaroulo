export type ResponseBody<T> = {
    status: number;
    message: string;
    data?: T;
};
export type ErrorResponse = {
    status: number;
    message: string;
    statusCode?: number;
    error?: string;
};
