#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const APP_NAME = "inskills";

function parseArgs(argv) {
  const args = {
    command: null,
    source: null,
    ref: null,
    useSsh: false,
    targets: new Set(),
    skills: [],
    allSkills: false,
    codexSkillsDir: null,
    claudeSkillsDir: null,
    force: false,
    dryRun: false,
    keepTemp: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "add" && !args.command) {
      args.command = "add";
    } else if ((arg === "--help" || arg === "-h") && !args.command) {
      args.help = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--ref") {
      args.ref = readValue(argv, (index += 1), arg);
    } else if (arg === "--ssh") {
      args.useSsh = true;
    } else if (arg === "--codex") {
      args.targets.add("codex");
    } else if (arg === "--claude-code") {
      args.targets.add("claude-code");
    } else if (arg === "--all" || arg === "--all-agents") {
      args.targets.add("codex");
      args.targets.add("claude-code");
    } else if (arg === "--skill" || arg === "-s") {
      args.skills.push(readValue(argv, (index += 1), arg));
    } else if (arg === "--skills") {
      args.skills.push(...readValue(argv, (index += 1), arg).split(",").map((value) => value.trim()));
    } else if (arg === "--all-skills") {
      args.allSkills = true;
    } else if (arg === "--codex-skills-dir" || arg === "--codex-dir") {
      args.codexSkillsDir = readValue(argv, (index += 1), arg);
    } else if (arg === "--claude-skills-dir" || arg === "--claude-dir") {
      args.claudeSkillsDir = readValue(argv, (index += 1), arg);
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--keep-temp") {
      args.keepTemp = true;
    } else if (!arg.startsWith("-") && args.command === "add" && !args.source) {
      args.source = arg;
    } else if (!arg.startsWith("-") && !args.command) {
      throw new Error(`Unknown command: ${arg}`);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function readValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp() {
  console.log(`Install agent skills from GitHub repositories.

Usage:
  ${APP_NAME} add <owner/repo[#ref]> [options]
  ${APP_NAME} add <local-path> [options]

Examples:
  npx ${APP_NAME}@latest add Redbean3/credit-card-bill-analysis-skills
  npx ${APP_NAME}@latest add Redbean3/credit-card-bill-analysis-skills --all
  npx ${APP_NAME}@latest add mattpocock/skills --skill tdd --codex
  npx ${APP_NAME}@latest add owner/repo#v1.0.0 --claude-code

Options:
  --ref <ref>                 Git ref, branch, or tag to install from.
  --ssh                       Clone GitHub repositories with SSH instead of HTTPS.
  --codex                     Install for Codex.
  --claude-code               Install for Claude Code.
  --all, --all-agents         Install for both Codex and Claude Code.
  -s, --skill <name>          Install one skill by name. Can be repeated.
  --skills <a,b>              Install a comma-separated list of skills.
  --all-skills                Install every discovered skill without prompting.
  --codex-skills-dir <path>   Codex skills directory. Default: \${CODEX_HOME:-~/.codex}/skills.
  --claude-skills-dir <path>  Claude Code skills directory. Default: \${CLAUDE_HOME:-~/.claude}/skills.
  --force                     Replace existing installed skill directories.
  --dry-run                   Show actions without writing files.
  --keep-temp                 Keep cloned repository temp directory for debugging.
  -h, --help                  Show this help.
`);
}

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function defaultCodexSkillsDir() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(codexHome, "skills");
}

function defaultClaudeSkillsDir() {
  const claudeHome = process.env.CLAUDE_HOME || path.join(os.homedir(), ".claude");
  return path.join(claudeHome, "skills");
}

function parseSourceSpec(rawSource, explicitRef, useSsh) {
  const expandedPath = path.resolve(expandHome(rawSource));
  if (fs.existsSync(expandedPath)) {
    return { type: "local", label: expandedPath, path: expandedPath };
  }

  const hashIndex = rawSource.indexOf("#");
  const source = hashIndex === -1 ? rawSource : rawSource.slice(0, hashIndex);
  const ref = explicitRef || (hashIndex === -1 ? null : rawSource.slice(hashIndex + 1));
  const githubMatch =
    source.match(/^https:\/\/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?$/) ||
    source.match(/^git@github\.com:([^/]+)\/([^/#]+?)(?:\.git)?$/) ||
    source.match(/^([^/\s]+)\/([^/#\s]+)$/);

  if (!githubMatch) {
    throw new Error(`Expected a GitHub repository like owner/repo, got: ${rawSource}`);
  }

  const owner = githubMatch[1];
  const repo = githubMatch[2];
  const cloneUrl = useSsh ? `git@github.com:${owner}/${repo}.git` : `https://github.com/${owner}/${repo}.git`;
  return {
    type: "github",
    label: `${owner}/${repo}${ref ? `#${ref}` : ""}`,
    owner,
    repo,
    ref,
    cloneUrl,
  };
}

function checkoutSource(source) {
  if (source.type === "local") {
    return { root: source.path, cleanup: () => {} };
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${APP_NAME}-`));
  const repoDir = path.join(tempRoot, "repo");
  const cloneArgs = ["clone", "--depth", "1"];
  if (source.ref) cloneArgs.push("--branch", source.ref);
  cloneArgs.push(source.cloneUrl, repoDir);

  try {
    execFileSync("git", cloneArgs, { stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    throw new Error(`Failed to clone ${source.label}.${stderr ? `\n${stderr}` : ""}`);
  }

  return {
    root: repoDir,
    cleanup: () => fs.rmSync(tempRoot, { recursive: true, force: true }),
    tempRoot,
  };
}

function discoverSkills(repoRoot) {
  const skills = [];
  const rootSkill = path.join(repoRoot, "SKILL.md");

  if (fs.existsSync(rootSkill)) {
    skills.push(readSkill(repoRoot, path.basename(repoRoot)));
  }

  const skillsDir = path.join(repoRoot, "skills");
  if (fs.existsSync(skillsDir)) {
    discoverSkillsUnder(skillsDir, skills);
  }

  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

function discoverSkillsUnder(dir, skills) {
  if (fs.existsSync(path.join(dir, "SKILL.md"))) {
    skills.push(readSkill(dir, path.basename(dir)));
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    discoverSkillsUnder(path.join(dir, entry.name), skills);
  }
}

function readSkill(skillDir, fallbackName) {
  const skillFile = path.join(skillDir, "SKILL.md");
  const text = fs.readFileSync(skillFile, "utf8");
  const frontmatter = parseFrontmatter(text);
  const name = frontmatter.name || fallbackName;
  return {
    name,
    description: frontmatter.description || "",
    dir: skillDir,
    installName: name,
  };
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---", 4);
  if (end === -1) return {};
  const yaml = text.slice(4, end);
  const result = {};

  for (const line of yaml.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

async function chooseSkills(skills, args) {
  if (skills.length === 0) {
    throw new Error("No skills found. Expected SKILL.md at repo root or skills/**/SKILL.md.");
  }

  if (args.allSkills) return skills;

  const requested = args.skills.filter(Boolean);
  if (requested.length > 0) {
    const byName = new Map(skills.map((skill) => [skill.name, skill]));
    const selected = [];
    for (const name of requested) {
      const skill = byName.get(name);
      if (!skill) {
        throw new Error(`Skill not found: ${name}. Available: ${skills.map((item) => item.name).join(", ")}`);
      }
      selected.push(skill);
    }
    return selected;
  }

  if (skills.length === 1) {
    console.log(`Found skill: ${skills[0].name}`);
    return skills;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Multiple skills found. Use --all-skills or --skill <name>.");
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("Which skills do you want to install?");
    skills.forEach((skill, index) => {
      const description = skill.description ? ` - ${skill.description}` : "";
      console.log(`  ${index + 1}) ${skill.name}${description}`);
    });
    const answer = (await rl.question(`Select numbers or names, comma-separated [all]: `)).trim();
    if (!answer) return skills;

    const selected = [];
    for (const token of answer.split(",").map((value) => value.trim()).filter(Boolean)) {
      const byNumber = Number.parseInt(token, 10);
      if (Number.isInteger(byNumber) && String(byNumber) === token) {
        const skill = skills[byNumber - 1];
        if (!skill) throw new Error(`No skill numbered ${token}`);
        selected.push(skill);
      } else {
        const skill = skills.find((item) => item.name === token);
        if (!skill) throw new Error(`No skill named ${token}`);
        selected.push(skill);
      }
    }
    return [...new Map(selected.map((skill) => [skill.name, skill])).values()];
  } finally {
    rl.close();
  }
}

async function chooseTargets(args) {
  if (args.targets.size > 0) return [...args.targets];

  if (!process.stdin.isTTY) {
    throw new Error("Choose at least one target agent with --all, --codex, or --claude-code.");
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("Which coding agents do you want to install the selected skills on?");
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
    if (entry.isSymbolicLink()) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath, options);
    else if (entry.isFile()) fs.copyFileSync(srcPath, destPath);
  }
}

async function installSkill(skill, target, args) {
  const targetLabel = target === "codex" ? "Codex" : "Claude Code";
  const skillsDir =
    target === "codex"
      ? path.resolve(expandHome(args.codexSkillsDir || defaultCodexSkillsDir()))
      : path.resolve(expandHome(args.claudeSkillsDir || defaultClaudeSkillsDir()));
  const destination = path.join(skillsDir, skill.installName);
  const action = fs.existsSync(destination) ? "replace" : "install";

  if (args.dryRun) {
    console.log(`[dry-run] ${action} ${targetLabel}: ${skill.dir} -> ${destination}`);
    return;
  }

  const overwrite = await shouldOverwrite(destination, args.force, process.stdin.isTTY);
  if (!overwrite) {
    console.log(`Skipped ${targetLabel}: ${destination}`);
    return;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  copyDir(skill.dir, destination, { omitAgents: target === "claude-code" });
  console.log(`Installed ${targetLabel}: ${destination}`);
}

async function runAdd(args) {
  if (!args.source) {
    throw new Error("Missing repository. Usage: inskills add <owner/repo[#ref]>");
  }

  const source = parseSourceSpec(args.source, args.ref, args.useSsh);
  const checkout = checkoutSource(source);

  try {
    const skills = discoverSkills(checkout.root);
    console.log(`Found ${skills.length} skill${skills.length === 1 ? "" : "s"} in ${source.label}.`);
    const selectedSkills = await chooseSkills(skills, args);
    const targets = await chooseTargets(args);

    for (const skill of selectedSkills) {
      for (const target of targets) {
        await installSkill(skill, target, args);
      }
    }
  } finally {
    if (checkout.tempRoot && args.keepTemp) {
      console.log(`Kept temp directory: ${checkout.tempRoot}`);
    } else {
      checkout.cleanup();
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.command) {
    printHelp();
    return;
  }

  if (args.command === "add") {
    await runAdd(args);
    return;
  }

  throw new Error(`Unknown command: ${args.command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
