import { getBalance } from "../index";

test("getBalance", () => {
  expect(getBalance("3684fdc729db856292a7ae7936a6fb4ca8b6a131b48df66e6dd7e9edf04be355")).toBe("13");
});
