"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk = require("./index.js");
/* tslint:disable:no-console */
console.log("before init");
await sdk.init();
console.log("after init");
console.log("before listAllocations");
sdk.listAllocations();
console.log("after listAllocations");
/* tslint:enable:no-console */
//# sourceMappingURL=example.js.map