# Credit Card Bill Analysis Skills

[English](README.en.md) | 简体中文

面向 Coding Agent 的信用卡账单分析 skill，帮助 Codex 或 Claude Code 将中文信用卡 PDF 账单转换为 Markdown，解析交易明细，剔除已退款对应账目，并生成消费分类、每日消费趋势、交互式 HTML 报告和 CSV 明细。

每个安装入口都支持本仓库的同一份 skill；你可以只安装到一个 agent，也可以同时安装到 Codex 和 Claude Code。

## 目录

| 工具 | 简介 | 安装方式 |
| --- | --- | --- |
| Codex | OpenAI 的编程 agent，使用 `${CODEX_HOME:-~/.codex}/skills` 作为默认 skill 目录。 | [`npx skills@latest add ...`](#quickstart30-秒安装) |
| Claude Code | 运行在终端内的 AI 编程助手，使用 `${CLAUDE_HOME:-~/.claude}/skills` 作为默认 skill 目录。 | [`npx skills@latest add ...`](#quickstart30-秒安装) |
| Both | 同时安装到 Codex 和 Claude Code。 | [`npx skills@latest add ...`](#quickstart30-秒安装) |

## Quickstart（30 秒安装）

1. 运行 skills.sh installer：

```bash
npx skills@latest add Redbean3/credit-card-bill-analysis-skills
```

2. 选择 `credit-card-bill-analysis`。

3. 选择要安装到的 coding agent：Codex、Claude Code，或两者都选。

4. 安装后，在你的 agent 中使用：

```text
Use $credit-card-bill-analysis to analyze this credit-card statement PDF.
```

## 功能

- 使用 MarkItDown 将信用卡账单 PDF 转换为 Markdown。
- 解析 CMB/招商银行风格的账单分区：`还款`、`分期`、`退款`、`消费`。
- 将同金额退款匹配到更早的正向交易，并从消费图表中剔除对应消费。
- 将消费归类到 `出行交通`、`食堂`、`其他饮食/食品商超`、`电商购物` 等类别。
- 生成 `report.html`、`report.md`、SVG 图表和 CSV 明细。

## 手动安装

先克隆仓库：

```bash
git clone git@github.com:Redbean3/credit-card-bill-analysis-skills.git
cd credit-card-bill-analysis-skills
```

### 交互式安装

```bash
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

### Codex

```bash
./setup --codex
```

默认安装到：

```text
${CODEX_HOME:-~/.codex}/skills/credit-card-bill-analysis
```

### Claude Code

```bash
./setup --claude-code
```

默认安装到：

```text
${CLAUDE_HOME:-~/.claude}/skills/credit-card-bill-analysis
```

安装到 Claude Code 时，脚本会省略 Codex 专用的 `agents/openai.yaml`。

### 同时安装

```bash
./setup --all
```

常用参数：

```bash
./setup --all --dry-run
./setup --all --force
./setup --codex --codex-dir ~/.codex/skills/credit-card-bill-analysis
./setup --claude-code --claude-dir ~/.claude/skills/credit-card-bill-analysis
```

## 使用

安装后，让你的 coding agent 使用该 skill：

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

## 输出文件

| 文件 | 说明 |
| --- | --- |
| `report.html` | 交互式 HTML 报告，包含指标卡、图表、可排序表格、分类明细切换、搜索和可折叠退款分区。 |
| `report.md` | Markdown 报告。 |
| `category_pie.svg` | 消费分类饼图。 |
| `daily_spending.svg` | 每日消费柱状/折线图。 |
| `transactions_parsed.csv` | 完整解析明细。 |
| `transactions_cleaned.csv` | 剔除已匹配退款后的消费明细。 |

## 仓库结构

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

## 相关资源

- [MarkItDown](https://github.com/microsoft/markitdown) — 将 PDF、Office、HTML 等文件转换为 Markdown。
- [uv](https://docs.astral.sh/uv/) — Python 包和工具管理器。

## 隐私

本仓库不包含任何真实账单 PDF、转换后的账单文本、分析报告或交易数据。

不要提交真实账单 PDF、转换后的 Markdown、生成的 HTML/Markdown 报告或 CSV 明细。仓库里的 `.gitignore` 已屏蔽该工作流常见的输入和输出文件。

## 环境要求

- 推荐 Python 3.11+ 运行分析脚本。
- PDF 转换需要 `uv` 和 MarkItDown。
- 分析脚本本身不依赖第三方 Python 包。

## 参与贡献

欢迎提交 issue 或 pull request 来改进更多账单格式、分类规则和安装目标支持。

## License

MIT
