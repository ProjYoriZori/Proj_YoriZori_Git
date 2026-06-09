# YoriZori Project Guidelines

## Session Entry

On project entry, **read only — no commands**:

1. Read `agent-skill-cast/CLAUDE.md` and `agent-skill-cast/README-KR.md`
   → Learn the skill system and available workflow guidelines
2. Scan `agent-skill-cast/` for available leader / staff / skill folders (any folder containing `SKILL.md`)
3. Read `docs/ROADMAP.md` to check current task priorities
4. Wait for the user's instruction

## On User Command

When a command is given:

1. **Select skills** from `agent-skill-cast/` appropriate to the task, in order:
   - leader skill → sets overall direction and approach
   - staff skill  → sets development conventions and process
   - task skill   → provides specific technical guidance

2. **Reference docs/** for project structure context:
   - `docs/FRONTEND_GUIDE.md` — frontend tasks
   - `docs/BACKEND_GUIDE.md`  — backend tasks
   - `docs/API_ENDPOINTS.md`  — API changes
   - `docs/DATABASE.md`       — DB schema

3. Execute the task following the selected skills' SKILL.md instructions

## Required Actions Before Ending Session

1. **`git add`** — stage all changed files
2. **Update MD** — update the relevant `docs/` file:
   - Feature added/changed → `docs/CHANGELOG.md`
   - Roadmap item completed → `docs/ROADMAP.md`
   - API changed → `docs/API_ENDPOINTS.md`
   - Frontend changed → `docs/FRONTEND_GUIDE.md`
   - Backend changed → `docs/BACKEND_GUIDE.md`

## Project Structure

- **FrontEnd**: `FrontEnd/src/screens/`, `FrontEnd/src/components/`, `FrontEnd/src/api/`
- **BackEnd**: `BackEnd/src/main/java/`, Spring Boot 3.3.x + Java 17
- **Docs**: `docs/`
- **Skills**: `agent-skill-cast/` (leader → staff → skill order)
