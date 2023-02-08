import * as sdk from "./index.js";

/* tslint:disable:no-console */
console.log("before init");
await sdk.init();
console.log("after init");

console.log("before listAllocations");
sdk.listAllocations();
console.log("after listAllocations");
/* tslint:enable:no-console */
