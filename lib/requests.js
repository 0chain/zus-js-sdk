"use strict";
/*
 * This file is part of the 0chain @zerochain/0chain distribution (https://github.com/0chain/client-sdk).
 * Copyright (c) 2018 0chain LLC.
 *
 * 0chain @zerochain/0chain program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicReqWithDispatch = exports.handleJsonResp = exports.fetchWithTimeout = void 0;
const fetchWithTimeout = async (url, options) => {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, Object.assign(Object.assign({}, options), { signal: controller.signal }));
    clearTimeout(id);
    return response;
};
exports.fetchWithTimeout = fetchWithTimeout;
const handleJsonResp = async (response) => {
    var _a;
    const contentType = (_a = response === null || response === void 0 ? void 0 : response.headers) === null || _a === void 0 ? void 0 : _a.get("content-type");
    const isJson = contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json");
    if (response.status >= 400 || !isJson) {
        const errorObj = {
            message: isJson ? response.statusText : "Response is not JSON",
            contentType,
            response,
        };
        if (isJson)
            errorObj.body = await response.json();
        throw errorObj;
    }
    return response.json();
};
exports.handleJsonResp = handleJsonResp;
const basicReqWithDispatch = async (props) => {
    const { url, options, params = {} } = props;
    const fullUrl = new URL(url);
    for (const key in params) {
        if (params[key])
            fullUrl.searchParams.append(key, params[key]);
    }
    return await (0, exports.fetchWithTimeout)(fullUrl, options)
        .then(exports.handleJsonResp)
        .then((data) => {
        return { data };
    })
        .catch((error) => {
        return { error };
    });
};
exports.basicReqWithDispatch = basicReqWithDispatch;
//# sourceMappingURL=requests.js.map