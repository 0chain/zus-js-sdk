import * as sdk from "./index";

console.log("before init");
await sdk.init();
console.log("after init");

console.log("before listAllocations");
sdk.listAllocations();
console.log("after listAllocations");
