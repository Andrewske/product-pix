# Agent Orchestration Learnings

Lessons learned from orchestrating multiple agents to implement code review fixes (commit `9b3673b` to `220fa77`).

---

## Context

An orchestrator agent was tasked with implementing 7 code review fixes from `docs/prompt-iterate/10-code-review-fixes.md`. Each fix was assigned to a separate agent, resulting in 7 commits. A post-implementation review found 2 issues requiring an additional fix.

**Success Rate**: 5/7 commits were correct (71%). 1 had a minor issue (commit message format), 1 introduced a bug that was missed by another agent's fix.

---

## Issues Encountered

### 1. Agent Coordination Gap

**What happened**:
- Task 4 agent implemented TODO stubs, introducing new code with `Date.now()` IDs
- Task 7 agent was supposed to fix all `Date.now()` ID generation
- Task 7 only fixed the original occurrence in `insights.ts`, missing the new one in `iterate.ts`

**Root cause**: Agents worked from a snapshot of the codebase. Task 7 didn't see Task 4's changes.

**Impact**: Critical bug - session loading would fail Zod validation.

### 2. Missing Validation Step

**What happened**: The UUID bug would have been caught immediately by:
- Running tests
- Attempting to create and reload a session
- TypeScript (if schema types were stricter)

**Root cause**: No integration testing requirement in task instructions.

### 3. Inconsistent Commit Messages

**What happened**: Commit `be68d52` used "Implement TODO stubs" instead of "feat: implement TODO stubs".

**Root cause**: Task instructions didn't explicitly require conventional commit format.

---

## Recommendations

### For Task Definition

```markdown
## Task Template Additions

### Post-Implementation Checklist
- [ ] Search codebase for similar patterns: `grep -r "PATTERN" --include="*.ts"`
- [ ] Verify no new occurrences of the anti-pattern exist
- [ ] Run relevant tests: `bun test <affected-files>`
- [ ] Confirm TypeScript passes: `bun tsc --noEmit`

### Commit Message Format
Use conventional commits: `type(scope): description`
- fix: bug fixes
- feat: new features
- refactor: code restructuring
- test: test additions/changes
```

### For Orchestration Strategy

#### Option A: Sequential Execution for Dependent Tasks

When tasks might create conflicting changes, run them sequentially:

```
Task 4 (implement stubs) → commit →
Task 7 (fix pattern X) → search includes Task 4 changes → commit
```

**Pros**: Each agent sees previous changes
**Cons**: Slower execution

#### Option B: Final Verification Pass

Run all tasks in parallel, then run a verification agent:

```
[Task 1] ─┐
[Task 2] ─┼─→ [Verification Agent] → final fixes
[Task 3] ─┘
```

**Verification Agent Responsibilities**:
- Grep for anti-patterns that should have been fixed
- Run full test suite
- Check for conflicts between agent changes
- Validate commit message format

**Pros**: Fast parallel execution + safety net
**Cons**: Extra agent invocation

#### Option C: Pattern-Based Task Grouping

Group related fixes into single tasks:

```markdown
## Task: Fix all non-UUID ID generation

Files to check:
- prompt-bench/commands/insights.ts
- prompt-bench/commands/iterate.ts
- prompt-bench/core/evolution.ts
- Any file using Date.now() for IDs

Search command: grep -r "Date.now()" --include="*.ts" | grep -v "duration\|startTime"
```

**Pros**: Single agent has full context
**Cons**: Larger task scope, longer execution

### For Task Instructions

#### Include Search Commands

```markdown
## Before Implementation
Run: `grep -r "Date.now()" prompt-bench/ --include="*.ts"`
Document all occurrences.

## After Implementation
Run the same grep. Verify only timing-related usages remain.
```

#### Require Test Execution

```markdown
## Validation Required
1. `bun test prompt-bench/` - all tests pass
2. `bun tsc --noEmit` - no TypeScript errors
3. Manual smoke test if applicable
```

#### Specify Commit Format

```markdown
## Commit Requirements
- Use conventional commit format: `type(scope): description`
- Include "why" in commit body for non-obvious changes
- Reference task number if applicable
```

---

## Recommended Orchestration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Parse task document                                       │
│ 2. Identify dependencies between tasks                       │
│ 3. Group independent tasks for parallel execution            │
│ 4. Execute task groups sequentially                          │
│                                                              │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│    │ Task 1  │ │ Task 2  │ │ Task 3  │  ← Parallel Group 1  │
│    └────┬────┘ └────┬────┘ └────┬────┘                      │
│         └───────────┼───────────┘                           │
│                     ▼                                        │
│              [Checkpoint: commit]                            │
│                     │                                        │
│    ┌─────────┐ ┌─────────┐                                  │
│    │ Task 4  │ │ Task 5  │  ← Parallel Group 2              │
│    └────┬────┘ └────┬────┘    (depends on Group 1)          │
│         └───────────┘                                        │
│                     │                                        │
│                     ▼                                        │
│ 5. Run verification agent                                    │
│    - Pattern grep for regressions                            │
│    - Full test suite                                         │
│    - Commit message validation                               │
│                                                              │
│ 6. Fix any issues found                                      │
│ 7. Final commit                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Metrics to Track

| Metric | This Run | Target |
|--------|----------|--------|
| Tasks completed correctly | 5/7 (71%) | >90% |
| Bugs introduced | 1 | 0 |
| Commit message issues | 1 | 0 |
| Post-fix commits needed | 1 | 0 |

---

## Checklist for Future Orchestration

- [ ] Review tasks for dependencies before assigning
- [ ] Group pattern-fix tasks together
- [ ] Include grep commands in task instructions
- [ ] Require test execution before commit
- [ ] Specify commit message format
- [ ] Plan for verification pass after parallel execution
- [ ] Track metrics for continuous improvement
