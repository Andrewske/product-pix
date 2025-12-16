# Configure Gitignore and Logs Directory

## Files to Modify/Create
- `.gitignore` (modify)
- `prompt-bench/logs/.gitkeep` (create)

## Implementation Details

### Update .gitignore
Add log files pattern to `.gitignore`:

```
# Prompt Bench Logs
prompt-bench/logs/*.log
```

### Create Logs Directory
Create the logs directory with a `.gitkeep` file to ensure the directory is tracked in git but log files are ignored:

```bash
mkdir -p prompt-bench/logs
touch prompt-bench/logs/.gitkeep
```

## Acceptance Criteria
- [ ] `.gitignore` updated with log files pattern
- [ ] `prompt-bench/logs/` directory exists
- [ ] `.gitkeep` file created in logs directory
- [ ] Log files (*.log) are gitignored but directory is tracked
- [ ] Verify with `git status` that new log files don't appear as untracked

## Dependencies
None - this can be done independently

## Notes
The logger code (Task 01) already creates the logs directory automatically on first run, but having `.gitkeep` ensures the directory structure is present in fresh clones before any logging occurs.
