const fs = require("fs");
const { execSync } = require("child_process");

function switchToDevMode() {
  console.log("Switching to dev mode...");

  execSync("cd ./example/next && git checkout dev", { stdio: "inherit" });
  execSync("rm -rf ./example/next/node_modules", { stdio: "inherit" });
  execSync("yarn --cwd ./example/next", { stdio: "inherit" });
  execSync("yarn dev:next", { stdio: "inherit" });
}

function switchToProdMode() {
  console.log("Switching to prod mode...");

  execSync("cd ./example/next && git checkout main", { stdio: "inherit" });
  execSync("yarn --cwd ./example/next", { stdio: "inherit" });
  execSync("yarn --cwd ./example/next dev", { stdio: "inherit" });
}

function checkErrors() {
  const errors = [];

  const arg = process.argv[2];
  const isInvalidArg = !arg || (arg && arg !== "dev" && arg !== "prod");
  if (isInvalidArg)
    errors.push("Invalid argument. Please use 'dev' or 'prod'.");

  const dirOrFileCheckList = ["./example/next/package.json"];
  dirOrFileCheckList.forEach((dirOrFile) => {
    if (!fs.existsSync(dirOrFile)) errors.push(`${dirOrFile} not found`);
  });

  if (errors.length) {
    errors.forEach((error) => console.error(error));
    process.exit(1);
  }
}

function init() {
  checkErrors();

  const arg = process.argv[2];
  if (arg === "dev") switchToDevMode();
  else if (arg === "prod") switchToProdMode();
  else {
    console.log("No mode specified. Using default mode (dev).");
    switchToDevMode();
  }
}

init();
