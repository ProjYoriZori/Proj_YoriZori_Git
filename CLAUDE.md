# YoriZori Project Guidelines

## Session Entry

On project entry, **read only — no commands**:

1. Read `agent-skill-cast/CLAUDE.md` and `agent-skill-cast/README-KR.md`
   → Learn available roles and workflow guidelines
2. Scan `agent-skill-cast/` for available leader / staff role folders (folders containing `SKILL.md`)
3. Read `docs/ROADMAP.md` to check current task priorities
4. Wait for the user's instruction

## On User Command — Role Selection

When a command is given, select roles from `agent-skill-cast/` that fit the task:

| Task type          | Leader              | Staff                        |
|--------------------|---------------------|------------------------------|
| 테스트 / QA        | project-leader      | qa-engineer / tester         |
| 프론트엔드 기능    | project-leader      | frontend-developer           |
| 백엔드 기능        | project-leader      | backend-developer            |
| DB / 스키마        | project-leader      | backend-developer / dba      |
| 문서화             | project-leader      | technical-writer             |
| 버그 수정          | project-leader      | 해당 도메인 staff            |

**Selection order:**
1. **Leader** → read `agent-skill-cast/<leader-role>/SKILL.md`
2. **Staff**  → read `agent-skill-cast/<staff-role>/SKILL.md`
3. Execute following the selected roles' SKILL.md instructions
4. Reference `docs/` for project structure as needed

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
- **Roles**: `agent-skill-cast/` (leader → staff 순서로 선택)
