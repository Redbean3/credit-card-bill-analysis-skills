# Credit Card Bill Analysis Skills

English | [简体中文](README.md)

A credit-card statement analysis skill for coding agents. It helps Codex or Claude Code convert Chinese credit-card statement PDFs to Markdown, parse transaction details, exclude refunded purchases, and generate spending categories, daily spending trends, an interactive HTML report, and CSV exports.

This repository contains both the `inskills` installer and the credit-card statement analysis skill. `inskills` installs `skills/**/SKILL.md` style skills from GitHub repositories into Codex, Claude Code, or both.

## Features

- Convert credit-card statement PDFs to Markdown with MarkItDown.
- Parse CMB-style sections: `还款`, `分期`, `退款`, and `消费`.
- Match equal-amount refunds to earlier positive transactions and exclude the matched charge from spending charts.
- Classify spending into categories such as `出行交通`, `食堂`, `其他饮食/食品商超`, `电商购物`, and more.
- Generate `report.html`, `report.md`, SVG charts, and CSV exports.

## Quickstart (30-second setup)

1. Use `inskills` to install this repository's skill from GitHub:

```bash
npx inskills@latest add Redbean3/credit-card-bill-analysis-skills
```

2. Pick the coding agents you want to install it on: Codex, Claude Code, or both.

3. After installation, use it in your agent:

```text
Use $credit-card-bill-analysis to analyze this credit-card statement PDF.
```

Non-interactive installs:

```bash
npx inskills@latest add Redbean3/credit-card-bill-analysis-skills --codex
npx inskills@latest add Redbean3/credit-card-bill-analysis-skills --claude-code
npx inskills@latest add Redbean3/credit-card-bill-analysis-skills --all
```

`inskills` can also install other public GitHub skill repositories:

```bash
npx inskills@latest add owner/repo
npx inskills@latest add owner/repo#v1.0.0 --all
npx inskills@latest add owner/repo --skill skill-name --codex
```

## Manual Install

Clone the repository first:

```bash
git clone git@github.com:Redbean3/credit-card-bill-analysis-skills.git
cd credit-card-bill-analysis-skills
```

### Interactive Install

```bash
./setup
```

The installer asks which coding agents you want to install this skill on:

```text
Which coding agents do you want to install this skill on?
  1) Codex
  2) Claude Code
  3) Both
  4) Cancel
```

### Codex

```bash
./setup --codex
```

Default target:

```text
${CODEX_HOME:-~/.codex}/skills/credit-card-bill-analysis
```

### Claude Code

```bash
./setup --claude-code
```

Default target:

```text
${CLAUDE_HOME:-~/.claude}/skills/credit-card-bill-analysis
```

When installing for Claude Code, the installer omits the Codex-specific `agents/openai.yaml` file.

### Install Both

```bash
./setup --all
```

Useful options:

```bash
./setup --all --dry-run
./setup --all --force
./setup --codex --codex-dir ~/.codex/skills/credit-card-bill-analysis
./setup --claude-code --claude-dir ~/.claude/skills/credit-card-bill-analysis
```

## Usage

After installation, ask your coding agent to use the skill:

```text
Use $credit-card-bill-analysis to analyze this credit-card statement PDF.
```

The skill will guide the agent through:

1. Converting the PDF with MarkItDown:

```bash
uvx --from 'markitdown[all]' markitdown statement.pdf -o statement.md
```

2. Running the bundled analyzer:

```bash
python3 scripts/analyze_cmb_credit_card_bill.py statement.md
```

3. Reviewing generated files, especially `report.html`.

## Outputs

| File | Description |
| --- | --- |
| `report.html` | Interactive HTML report with summary cards, charts, sortable tables, category detail tabs, search, and collapsible refund sections. |
| `report.md` | Markdown report. |
| `category_pie.svg` | Category pie chart. |
| `daily_spending.svg` | Daily spending bar/line chart. |
| `transactions_parsed.csv` | Full parsed transaction export. |
| `transactions_cleaned.csv` | Cleaned spending export after matched-refund exclusions. |

## Repository Layout

```text
.
├── bin/
│   └── install.mjs
├── package.json
├── setup
└── skills/
    └── credit-card-bill-analysis/
        ├── SKILL.md
        ├── agents/
        │   └── openai.yaml
        └── scripts/
            └── analyze_cmb_credit_card_bill.py
```

## Resources

- [MarkItDown](https://github.com/microsoft/markitdown) — convert PDF, Office, HTML, and other files to Markdown.
- [uv](https://docs.astral.sh/uv/) — Python package and tool manager.

## Privacy

This repository intentionally contains no real statement PDFs, converted statement text, generated reports, or transaction data.

Do not commit real statement PDFs, converted Markdown files, generated HTML/Markdown reports, or CSV exports. The `.gitignore` blocks common inputs and outputs created by this workflow.

## Requirements

- Python 3.11+ recommended for the analyzer.
- `uv` and MarkItDown for PDF conversion.
- No third-party Python packages are required by the analyzer itself.

## Contributing

Issues and pull requests are welcome for additional statement formats, category rules, and installation targets.

## License

MIT
