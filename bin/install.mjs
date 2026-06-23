#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const SKILL_NAME = "credit-card-bill-analysis";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceSkillDir = path.join(repoRoot, "skills", SKILL_NAME);

function parseArgs(argv) {
  const args = {
    target: null,
    codexDir: null,
    claudeDir: null,
    force: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--codex") args.target = "codex";
    else if (arg === "--claude-code") args.target = "claude-code";
    else if (arg === "--all") args.target = "all";
    else if (arg === "--force") args.force = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--codex-dir") args.codexDir = argv[++index];
    else if (arg === "--claude-dir") args.claudeDir = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`Install ${SKILL_NAME} for Codex and/or Claude Code.

Usage:
  npx github:Redbean3/credit-card-bill-analysis-skills [options]

Options:
  --codex                 Install only for Codex.
  --claude-code           Install only for Claude Code.
  --all                   Install for both Codex and Claude Code.
  --codex-dir <path>      Exact Codex skill target directory.
  --claude-dir <path>     Exact Claude Code skill target directory.
  --force                 Replace existing installed skill directories.
  --dry-run               Show actions without writing files.
  -h, --help              Show this help.
`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function defaultCodexDir() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills", SKILL_NAME);
}

function defaultClaudeDir() {
  const claudeHome = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
  return path.join(claudeHome, "skills", SKILL_NAME);
}

async function promptTargets() {
  const rl = readline.createInterface({ input, output });
  try {
    console.log("Which coding agents do you want to install this skill on?");
    console.log("  1) Codex");
    console.log("  2) Claude Code");
    console.log("  3) Both");
    console.log("  4) Cancel");
    const answer = (await rl.question("Select 1-4 [3]: ")).trim() || "3";
    if (answer === "1") return ["codex"];
    if (answer === "2") return ["claude-code"];
    if (answer === "3") return ["codex", "claude-code"];
    throw new Error("Cancelled.");
  } finally {
    rl.close();
  }
}

async function shouldOverwrite(destination, force, interactive) {
  if (!fs.existsSync(destination)) return true;
  if (force) return true;
  if (!interactive) {
    throw new Error(`Target already exists: ${destination}. Re-run with --force to replace it.`);
  }

  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question(`Replace existing skill at ${destination}? [y/N]: `))
      .trim()
      .toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

function copyDir(src, dest, options = {}) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of entries) {
    if (options.omitAgents && entry.name === "agents") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath, options);
    else if (entry.isFile()) fs.copyFileSync(srcPath, destPath);
  }
}

async function installTarget(label, destination, options) {
  if (!fs.existsSync(sourceSkillDir)) {
    throw new Error(`Missing source skill directory: ${sourceSkillDir}`);
  }

  const action = fs.existsSync(destination) ? "replace" : "install";
  if (options.dryRun) {
    console.log(`[dry-run] ${action} ${label}: ${sourceSkillDir} -> ${destination}`);
    return;
  }

  const overwrite = await shouldOverwrite(destination, options.force, options.interactive);
  if (!overwrite) {
    console.log(`Skipped ${label}: ${destination}`);
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  copyDir(sourceSkillDir, destination, { omitAgents: label === "Claude Code" });
  console.log(`Installed ${label}: ${destination}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const interactive = process.stdin.isTTY && !args.target;
  const targets = args.target
    ? args.target === "all"
      ? ["codex", "claude-code"]
      : [args.target]
    : await promptTargets();

  if (targets.includes("codex")) {
    await installTarget("Codex", path.resolve(expandHome(args.codexDir || defaultCodexDir())), {
      force: args.force,
      dryRun: args.dryRun,
      interactive,
    });
  }

  if (targets.includes("claude-code")) {
    await installTarget("Claude Code", path.resolve(expandHome(args.claudeDir || defaultClaudeDir())), {
      force: args.force,
      dryRun: args.dryRun,
      interactive,
    });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
