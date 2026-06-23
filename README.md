# Credit Card Bill Analysis Skills

语言 / Language: [中文](#中文) | [English](#english)

## 中文

一个面向 Coding Agent 的信用卡账单分析 skill。它可以指导 agent 使用 `uv` + MarkItDown 将中文信用卡 PDF 账单转换成 Markdown，再解析招商银行/CMB 风格的账单明细，剔除已退款对应账目，生成消费分类、每日消费趋势、交互式 HTML 报告和 CSV 明细。

> 本仓库不包含任何真实账单 PDF、转换后的账单文本、分析报告或交易数据。

### 功能

- 使用 MarkItDown 将信用卡账单 PDF 转换为 Markdown。
- 解析 CMB/招商银行风格的账单分区：`还款`、`分期`、`退款`、`消费`。
- 将同金额退款匹配到更早的正向交易，并从消费图表中剔除对应消费。
- 将消费归类到 `出行交通`、`食堂`、`其他饮食/食品商超`、`电商购物` 等类别。
- 生成以下文件：
  - `report.html`：交互式 HTML 报告，包含指标卡、图表、可排序表格、分类明细切换、搜索和可折叠退款分区。
  - `report.md`：Markdown 报告。
  - `category_pie.svg`：消费分类饼图。
  - `daily_spending.svg`：每日消费柱状/折线图。
  - `transactions_parsed.csv` 和 `transactions_cleaned.csv`：解析明细和清洗后消费明细。

### 安装

克隆仓库并运行安装脚本：

```bash
git clone git@github.com:Redbean3/credit-card-bill-analysis-skills.git
cd credit-card-bill-analysis-skills
./setup
```

安装脚本会询问要安装到哪个 coding agent：

```text
Which coding agents do you want to install this skill on?
  1) Codex
  2) Claude Code
  3) Both
  4) Cancel
```

也可以使用非交互参数：

```bash
./setup --codex
./setup --claude-code
./setup --all
./setup --all --force
./setup --all --dry-run
```

默认安装位置：

- Codex: `${CODEX_HOME:-~/.codex}/skills/credit-card-bill-analysis`
- Claude Code: `${CLAUDE_HOME:-~/.claude}/skills/credit-card-bill-analysis`

也可以指定精确安装目录：

```bash
./setup --codex --codex-dir ~/.codex/skills/credit-card-bill-analysis
./setup --claude-code --claude-dir ~/.claude/skills/credit-card-bill-analysis
```

### 使用

安装后，可以这样让 agent 使用该 skill：

```text
Use $credit-card-bill-analysis to analyze this credit-card statement PDF.
```

该 skill 会引导 agent 完成：

1. 使用 MarkItDown 转换 PDF：

```bash
uvx --from 'markitdown[all]' markitdown statement.pdf -o statement.md
```

2. 运行内置分析脚本：

```bash
python3 scripts/analyze_cmb_credit_card_bill.py statement.md
```

3. 查看生成文件，尤其是 `report.html`。

### 仓库结构

```text
.
├── setup
└── skills/
    └── credit-card-bill-analysis/
        ├── SKILL.md
        ├── agents/
        │   └── openai.yaml
        └── scripts/
            └── analyze_cmb_credit_card_bill.py
```

`agents/openai.yaml` 是 Codex 使用的 UI metadata。安装到 Claude Code 时，安装脚本会省略该目录。

### 隐私

不要提交真实账单 PDF、转换后的 Markdown、生成的 HTML/Markdown 报告或 CSV 明细。仓库里的 `.gitignore` 已屏蔽该工作流常见的输入和输出文件。

### 环境要求

- 推荐 Python 3.11+ 运行分析脚本。
- PDF 转换需要 `uv` 和 MarkItDown。
- 分析脚本本身不依赖第三方 Python 包。

### License

MIT

## English

A credit-card statement analysis skill for coding agents. It guides an agent to use `uv` + MarkItDown to convert Chinese credit-card statement PDFs into Markdown, parse CMB-style transaction details, exclude refunded purchases, and generate spending categories, daily spending trends, an interactive HTML report, and CSV exports.

> This repository intentionally contains no real statement PDFs, converted bills, reports, or transaction data.

### Features

- Convert credit-card statement PDFs to Markdown with MarkItDown.
- Parse CMB-style sections: `还款`, `分期`, `退款`, and `消费`.
- Match equal-amount refunds to earlier positive transactions and exclude the matched charge from spending charts.
- Classify spending into categories such as `出行交通`, `食堂`, `其他饮食/食品商超`, `电商购物`, and more.
- Generate:
  - `report.html`: interactive HTML report with summary cards, charts, sortable tables, category detail tabs, search, and collapsible refund sections.
  - `report.md`: Markdown report.
  - `category_pie.svg`: category pie chart.
  - `daily_spending.svg`: daily spending bar/line chart.
  - `transactions_parsed.csv` and `transactions_cleaned.csv`.

### Install

Clone the repository and run the setup script:

```bash
git clone git@github.com:Redbean3/credit-card-bill-analysis-skills.git
cd credit-card-bill-analysis-skills
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

Non-interactive options:

```bash
./setup --codex
./setup --claude-code
./setup --all
./setup --all --force
./setup --all --dry-run
```

Default install targets:

- Codex: `${CODEX_HOME:-~/.codex}/skills/credit-card-bill-analysis`
- Claude Code: `${CLAUDE_HOME:-~/.claude}/skills/credit-card-bill-analysis`

You can override exact target directories:

```bash
./setup --codex --codex-dir ~/.codex/skills/credit-card-bill-analysis
./setup --claude-code --claude-dir ~/.claude/skills/credit-card-bill-analysis
```

### Usage

After installation, ask your coding agent something like:

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

### Repository Layout

```text
.
├── setup
└── skills/
    └── credit-card-bill-analysis/
        ├── SKILL.md
        ├── agents/
        │   └── openai.yaml
        └── scripts/
            └── analyze_cmb_credit_card_bill.py
```

`agents/openai.yaml` is Codex UI metadata. The installer omits that directory when installing for Claude Code.

### Privacy

Do not commit real statement PDFs, converted Markdown files, generated HTML/Markdown reports, or CSV exports. The `.gitignore` blocks common inputs and outputs created by this workflow.

### Requirements

- Python 3.11+ recommended for the analyzer.
- `uv` and MarkItDown for PDF conversion.
- No third-party Python packages are required by the analyzer itself.

### License

MIT
