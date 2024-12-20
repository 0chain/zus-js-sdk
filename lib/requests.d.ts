export function fetchWithTimeout(url: any, options: any): Promise<Response>;
export function handleJsonResp(response: any): Promise<any>;
export function basicReqWithDispatch(props: any): Promise<{
    data: any;
} | {
    error: any;
}>;
