# Decision Explorer: Data Centers

[![Explorer](https://img.shields.io/badge/explorer-live-brightgreen)](https://civic-interconnect.github.io/decision_explorer_data_centers/explorer/)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://civic-interconnect.github.io/decision_explorer_data_centers/)
[![CI Status](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/ci-python-zensical.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/ci-python-zensical.yml)
[![Link Check](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/links.yml/badge.svg?branch=main)](https://github.com/civic-interconnect/decision_explorer_data_centers/actions/workflows/links.yml)
[![Python 3.14+](https://img.shields.io/badge/python-3.14%2B-blue?logo=python)](#)
[![MIT](https://img.shields.io/badge/license-see%20LICENSE-yellow.svg)](./LICENSE)

> Putting Data Centers in Context: Promise, Burden, and the Case for Sound Governance

**[Try the Interactive Explorer](https://civic-interconnect.github.io/decision_explorer_data_centers/explorer/)**
To accept the example data and see the results, click the green "Evaluate" button in the lower right-hand corner of either:

- The Example Policies data (TOML)
- The Example Sites data (CSV)

![View Results](./docs/images/view-results.png)

![Edit Policy](./docs/images/edit-policy.png)

![Edit Candidate Site](./docs/images/edit-candidate-site.png)

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
not the specific values used in any given evaluation.

- Constraints, thresholds, and weights are configurable
- Assumptions are explicit and inspectable
- Results are comparative and assumption-dependent

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
# Set Up the Environment
uv self update
uv python pin 3.14
uv sync --extra dev --extra docs --upgrade
uvx pre-commit install

# Local format + lint
uv run ruff format --check .
uv run ruff check .

# Pre-commit (enforce repo rules)
git add -A
uvx pre-commit run --all-files
# repeat if changes were made
git add -A
uvx pre-commit run --all-files

# Static + security + dependency checks
uv run validate-pyproject pyproject.toml
uv run deptry .
uv run bandit -c pyproject.toml -r src

# Tests (after static checks pass)
uv run pytest --cov=src --cov-report=term-missing

uv run python -m decision_explorer_data_centers.cli --candidates data/raw/example_candidates.csv --policy data/raw/example_policy.toml --output-json docs/data/results.json

# Docs build (after everything passes)
uv run zensical build

# Commit and push
git add -A
git commit -m "update"
git push -u origin main
```

</details>

## Potential Benefits

- **Tax revenue**: the most reliable benefit when negotiated well. In West Des Moines, Iowa, Microsoft's data centers are projected to generate over $2 billion in tax revenues over the agreement period ([Brookings](https://www.brookings.edu/articles/why-community-benefit-agreements-are-necessary-for-data-centers/)). Loudoun County, Virginia (the largest data center market in the world) now receives an estimated $890 million annually in data center tax revenue, nearly matching its entire operating budget, and has lowered its residential real estate tax rate incrementally as a result.¹

- **Grid investment**: data center demand can accelerate grid upgrades that benefit all ratepayers, not just the facility ([Brookings](https://www.brookings.edu/articles/why-community-benefit-agreements-are-necessary-for-data-centers/)).

- **Broadband**: some operators have built regional fiber networks as part of development agreements, enabling businesses, students, and telemedicine across rural areas that would otherwise lack connectivity ([Brookings](https://www.brookings.edu/articles/turning-the-data-center-boom-into-long-term-local-prosperity/)).

- **University and workforce partnerships**: Microsoft partnered with Gateway Technical College in Wisconsin to launch a Datacenter Academy training more than 1,000 students in five years, and partnered with the University of Wisconsin-Madison on AI-driven research ([Brookings](https://www.brookings.edu/articles/turning-the-data-center-boom-into-long-term-local-prosperity/)).

¹ Loudoun County figures: [Cardinal News](https://cardinalnews.org/2025/04/10/data-centers-can-bring-high-paying-jobs-and-millions-in-tax-revenue-is-that-what-southside-will-get/)

## Resources

### Energy demand - global and U.S.

- International Energy Agency (IEA) Energy and AI (April 2025): https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai
  - Global: ~415 TWh in 2024 (1.5% of global electricity); projected to double to ~945 TWh by 2030 (~3%)
  - U.S.: ~45% of global total in 2024; ~4% of all U.S. electricity
  - Nearly half of U.S. capacity concentrated in five regional clusters (Northern Virginia, Dallas, Silicon Valley, Phoenix, Chicago area)
  - U.S. data centers projected to consume more electricity by 2030 than all energy-intensive manufacturing combined
  - AI is primary driver; accelerated servers growing ~30% annually
- U.S. Energy Information Administration (EIA): https://www.eia.gov/
- U.S. Department of Energy (DOE): https://www.energy.gov/

### Data center energy and infrastructure

- Lawrence Berkeley National Laboratory: https://datacenters.lbl.gov/
- Electric Power Research Institute (EPRI): https://www.epri.com/

### Water and environmental context

- U.S. Geological Survey (USGS): https://www.usgs.gov/
- USGS Water Use in the United States: https://www.usgs.gov/mission-areas/water-resources/science/water-use-united-states
- World Resources Institute (WRI): https://www.wri.org/

### Policy and governance

- National Conference of State Legislatures (NCSL): https://www.ncsl.org/
- Federal Energy Regulatory Commission (FERC): https://www.ferc.gov/

### Industry practices and metrics

- Uptime Institute: https://uptimeinstitute.com/
- Green Grid: https://www.thegreengrid.org/
