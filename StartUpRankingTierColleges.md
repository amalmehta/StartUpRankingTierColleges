PROJECT NAME: StartUpRankingTierColleges

META-INSTRUCTIONS:

<Read it all before acting. Ask about anything unclear, contradictory or
 underspecified — before starting and mid-build. Ask in the question widget
 (AskUserQuestion): related questions batched, concrete options, your
 recommendation first. Plain text only if the widget isn't available.>

<Don't expand scope. Anything not listed here is a proposal, including changes
 to this file — propose it, don't do it.>

<Prefer doing over describing: run the code, write the files, test it.>

<Always in scope, no proposal needed: when it goes on GitHub, a README that is
 easy to read at a glance — a line on what it is, then clear visuals
 (screenshots, a diagram or a chart), then links. Everything else goes in
 linked files: docs/INSTRUCTIONS.md (setup, run, use),
 docs/SYSTEM-DESIGN.md (see below) and docs/FILE-STRUCTURE.md (what's where). If what you're
 building is an application rather than a script, also a small unobtrusive feedback tab, and a settings
 button or tab (⌘, on the Mac) that gathers its preferences in one place.>

<If what you're building is an application, build it as a Mac app first; the
 website comes after, as its own step.>

<When an application takes files as input, offer a visible Upload button that
 opens the file picker, accept files dragged anywhere onto the window (not
 only onto a small drop zone), and accept pasting them with ⌘V.>

<Color-code tags, categories and types by similarity: related ones share a
 hue family, with shades far enough apart to tell them apart at a glance, in
 both light and dark mode.>

<Name things the way a person would say them — "Goal Tracker", not
 goal_tracker — for the app, its windows, titles, files people open, repo
 descriptions and README headings. When you create the GitHub repo, name it
 with no "_" or "-": one word or joined words, e.g. GoalTracker.>

<Always in scope: a system design doc in the codebase, docs/SYSTEM-DESIGN.md,
 kept current as the build changes. Cover the architecture (with a Mermaid
 diagram), each component's job, the main flows, where data lives, the key
 design decisions and their trade-offs, how it's tested, and known limits.>

<Finish by listing every deliverable: path, what it is, how to check it works.>

<Git rules (no Claude attribution, never commit .claude/) are in
 ~/.claude/CLAUDE.md and apply on their own — nothing to repeat here.>

<Keep the changelog at the bottom current.>

CONTEXT:

figure out what colleges are the best for starting the worlds most ambitious, influential, and useful companies

DELIVERABLES:

website

OPEN QUESTIONS / ASSUMPTIONS:

<Agent fills in: what it guessed, what it decided without asking.>

Asked and answered (2026-10-15):
- Form: a static website only. It's a data report, not an application, so no Mac app, feedback tab or settings.
- Method: a blended ranking with adjustable weights (value created, companies, impact, per student), grouped into S–D tiers.
- Scope: colleges worldwide.
- Publishing: local first; on 2026-10-17 the user asked to push to GitHub (public repo StartUpRankingTierColleges) and host on GitHub Pages via an Actions workflow.

Decided without asking:
- Dataset: a hand-curated list of landmark companies (1939–2023): 128 at launch, expanded to 172 (321 founders, 144 colleges, 22 countries) on 2026-10-18, compiled from public knowledge up to late 2025. Not a paywalled unicorn database.
- Expansion (2026-10-18): added 27 Asian, 2 Israeli and 15 European companies. Only founders with well-documented education were included; companies with uncertain founder schools (e.g. Wiz, Adyen, Wise, PhonePe) were left out.
- Credit: a founder credits every college they attended, tagged undergrad, grad or left. Each company counts once per college, at full credit by default. Split credit and the role filters are toggles.
- Value is log-damped: log2(1 + peak $B). Impact is a 1–5 judgment score. The per-student rate adds a 20,000-student allowance.
- Tiers are relative to the leader (100): S ≥ 60, A ≥ 30, B ≥ 15, C ≥ 6, D below.
- Elon Musk's two years at Queen's count as "left". His two days at Stanford are not counted.
- Site title: "Startup College Tier List". Plain HTML, CSS and JS, no build. Light and dark mode follow the OS.
- README and docs were written now so they're ready for GitHub.

CHANGELOG:

- 2026-10-15 — created
- 2026-09-15 — added meta-instruction: built-out applications include a small feedback tab
- 2026-09-15 — added meta-instruction: no "Claude" attribution in commits, PRs, or branches
- 2026-09-16 — added meta-instruction: always include a README when adding to GitHub
- 2026-09-16 — changed meta-instruction: ask clarifying questions in the question widget
- 2026-09-17 — added meta-instructions: Claude never a contributor; never commit .claude/
- 2026-09-26 — compressed the meta-instructions and every field prompt; git rules moved to the global instruction file
- 2026-09-27 — added meta-instruction: applications are built as a Mac app first, then a website
- 2026-09-28 — folded inputs, instructions, constraints, deliverables and done criteria into one free-form CONTEXT
- 2026-09-28 — changed meta-instruction: a README on GitHub always includes a visual
- 2026-09-28 — added meta-instruction: name things like a person would, never snake_case
- 2026-09-28 — changed meta-instruction: README leads with visuals; instructions live in a linked guide
- 2026-09-28 — changed meta-instruction: README is visuals and links; details in docs/INSTRUCTIONS.md and docs/FILE-STRUCTURE.md
- 2026-09-29 — changed meta-instruction: GitHub repo names have no "_" or "-"
- 2026-10-02 — added a DELIVERABLES field after CONTEXT
- 2026-10-02 — added meta-instruction: every project has a system design doc at docs/SYSTEM-DESIGN.md
- 2026-10-05 — added meta-instruction: applications include a settings button or tab
- 2026-10-08 — added meta-instruction: color-code tags by similarity (related share a hue family, each distinct)
- 2026-10-09 — added meta-instruction: apps that take files have an Upload button, drop anywhere, and paste
- 2026-10-15 — built the website (site/), tests, README and docs; recorded the answered questions and assumptions
- 2026-10-17 — pushed to GitHub and set up GitHub Pages (Actions workflow deploys site/)
- 2026-10-18 — expanded the dataset with 44 Asian, Israeli and European companies (172 total)
