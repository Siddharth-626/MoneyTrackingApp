#!/usr/bin/env node

const { spawn } = require("node:child_process");

const args = process.argv.slice(2);
const envArg = args.shift();

if (!envArg || !envArg.includes("=")) {
  console.error("Usage: node scripts/run-with-env.js KEY=VALUE <command> [args...]");
  process.exit(1);
}

const eqIndex = envArg.indexOf("=");
const key = envArg.slice(0, eqIndex);
const value = envArg.slice(eqIndex + 1);
const command = args.shift();

if (!key || !command) {
  console.error("Usage: node scripts/run-with-env.js KEY=VALUE <command> [args...]");
  process.exit(1);
}

const child = spawn(command, args, {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    [key]: value,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
