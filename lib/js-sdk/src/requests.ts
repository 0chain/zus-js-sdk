type TFetchOptions = RequestInit & { timeout?: number };
export const fetchWithTimeout = async (
  url: string,
  options: TFetchOptions = {}
) => {
  const { timeout = 15000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
};

export const handleJsonResp = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (response.status >= 400 || !isJson) {
    const errorObj = {
      message: isJson ? response.statusText : "Response is not JSON",
      contentType,
      response,
      status: response.status,
      body: null,
    };

    if (isJson) errorObj.body = await response.json();

    throw errorObj;
  }

  return response.json();
};

type TBasicReqProps = {
  url: string;
  options?: TFetchOptions;
  params?: Record<string, string>;
};
/* Handles basic requests with params with JSON parsing of the response. */
export const basicRequest = async (props: TBasicReqProps) => {
  const { url, options = {}, params = {} } = props;

  const fullUrl = new URL(url);
  for (const key in params) {
    const value = params[key];
    if (value) fullUrl.searchParams.append(key, value);
  }
  const reqUrl = fullUrl.toString();
  return await fetchWithTimeout(reqUrl, options)
    .then(handleJsonResp)
    .then((data) => ({ data, error: null }))
    .catch((error) => ({ data: null, error }));
};
