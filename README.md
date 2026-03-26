# Decision Explorer: Data Centers

[![Explorer](https://img.shields.io/badge/explorer-live-brightgreen)](https://civic-interconnect.github.io/decision_explorer_data_centers/explorer/)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://civic-interconnect.github.io/decision_explorer_data_centers/)
[![CI Status](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/ci-python-zensical.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/ci-python-zensical.yml)
[![Python 3.14+](https://img.shields.io/badge/python-3.14%2B-blue?logo=python)](#)
[![MIT](https://img.shields.io/badge/license-see%20LICENSE-yellow.svg)](./LICENSE)

> Putting Data Centers in Context: Promise, Burden, and the Case for Sound Governance

**[Try the Interactive Explorer](https://civic-interconnect.github.io/decision_explorer_data_centers/explorer/)**
To accept the example data and see the results, click the green "Evaluate" button in the lower right-hand corner of either:
- The Example Sites data (CSV)
- The Example Policies data (TOML)   

NOTE: March 2026. You may see unrelated Copilot warnings in VS Code due to a known Microsoft issue.
These can be ignored.

## This Project

This project provides a structured framework for exploring data center siting
and governance tradeoffs under explicit assumptions and constraints.
It:

- frames the issue as one of infrastructure governance
- recognizes the distribution of costs vs benefits
- emphasizes integration with broader systems rather than isolated analysis

The goal is to make tradeoffs visible and inspectable across multiple dimensions.

## Contribution

The contribution of this project is the framework for structured exploration,
not the specific values used in any given scenario.

- Constraints, thresholds, and weights are configurable
- Assumptions are explicit and inspectable
- Results are comparative and scenario-dependent

This project does not determine outcomes or recommend decisions.
It provides a way to examine how different assumptions and constraints shape outcomes.

## Working Files

Working files are found in these areas:

- **data/** - source inputs and scenario configuration
- **docs/** - narrative, assumptions, and analysis
- **src/** - implementation

## Current Capabilities

- Loads candidate sites from CSV and policy constraints from TOML
- Evaluates hard-constraint admissibility for each site (PASS / FAIL)
- Evaluates scenario-level decisions (APPROVE / CONDITIONAL / REJECT)
- Exports results as JSON for the web Explorer
- Interactive web Explorer for non-technical users

## Command Reference

<details>
<summary>Show command reference</summary>

### In a machine terminal (open in your `Repos` folder)

After you get a copy of this repo in your own GitHub account,
open a machine terminal in your `Repos` folder:

```shell
# Replace username with YOUR GitHub username.
git clone https://github.com/username/decision_explorer_data_centers

cd decision_explorer_data_centers
code .
```

### In a VS Code terminal

```shell
uv self update
uv python pin 3.14
uv sync --extra dev --extra docs --upgrade

uvx pre-commit install
git add -A
uvx pre-commit run --all-files
# repeat if changes were made
git add -A
uvx pre-commit run --all-files

uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidate_sites.csv --policy data/raw/example_minnesota_policy.toml --output-json docs/data/results.json

uv run ruff format .
uv run ruff check . --fix
uv run zensical build

git add -A
git commit -m "update"
git push -u origin main
```

</details>

## Developer

```shell
Get-ChildItem -Recurse | Where-Object { $_.FullName -notlike '*\__pycache__\*' -and $_.FullName -notlike '*\.git\*' -and $_.FullName -notlike '*\.venv\*' -and $_.Extension -ne '.pyc' -and $_.Extension -ne '.lock' } | Select-Object -ExpandProperty FullName
```

## Resources

[International Energy Agency (IEA)](https://www.iea.org/)

- Data centers are ~1.5% of global electricity today, rising to ~3% by 2030
- Major driver of demand increase. In the U.S., potentially ~50% of new demand this decade.
- [Energy demand from AI](https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai)
