# TrainBot Engineering Notebooks

Acest folder e auto-managed prin **Deepnote → GitHub sync**.

## Setup

Project Deepnote `TrainBot Engineering` (workspace `TrainBot`, ID `e0e01c22-c7d3-4181-956f-506ad531fc74`) e conectat la acest repo (`trainbotai/TrainBot`) pe branch `notebooks` la path `docs/notebooks/`.

## Workflow

- **Editare normală:** în Deepnote UI → save → commit auto pe branch `notebooks`
- **Read-only access:** orice dev poate citi `.ipynb` files direct pe GitHub (fără cont Deepnote)
- **Promovare la main:** când vrem ca un ADR/runbook să devină referință oficială → PR `notebooks → main`

## Conținut

- `00-Overview.ipynb` — convenții echipa, stack quick reference
- `01-Active-Sprint.ipynb` — current sprint goals + tasks + blockers
- `02-ADRs.ipynb` — Architecture Decision Records cu template
- `03-Tech-Debt-Log.ipynb` — issue cunoscute cu impact + priority
- `04-Dev-Setup.ipynb` — onboarding new dev (prerequisites + clone + run)
- `05-GitHub-Live.ipynb` — live snapshot PRs/commits/CI runs cu Python refresh

## Gotchas

- **Output în .ipynb files:** dacă DataFrames mari → polueaza diff git. Best practice: clear outputs înainte de commit (poate fi setting automat în Deepnote).
- **Conflicts:** dacă editezi simultan în Deepnote + GitHub direct → merge conflict. Recomandare: edit doar într-un loc per session.
- **CI/CD:** branch `notebooks` NU declanșează deploy workflow (paths-filter exclude `docs/**`).
