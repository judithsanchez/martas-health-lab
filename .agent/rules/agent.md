---
trigger: always_on
---

- Every task needs to be also a Github issue
- When an implementation plan is created automatically create a github Issue
- Use Github CLI or MCP
- If you didn't create a Github issue for a task, use Github CLI to check if there is already an issue related to the task on hand. Ask for confiration
- Always create a new brach per task
- Before creating a new branch pull the latest master
- Never commit code with type or lint issues without my approval
- Before creatinig a PR rebase the branch
- Write Happy Path tests always
- Run periodically these checks

# Quality Control Commands

pnpm test # Run all tests
pnpm type-check # Run TypeScript validation
pnpm lint # Run ESlint checks
