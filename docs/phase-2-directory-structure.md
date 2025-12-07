# Phase 2: Create Directory Structure

## Overview
Create the new `prompt-bench/` directory structure before moving files.

## Tasks

### 2.1 Create Directory Structure

Run the following command to create all required directories:

```bash
mkdir -p prompt-bench/{commands,core,templates,db,__tests__,fixtures/images}
```

### 2.2 Expected Structure

After this phase, you should have:

```
prompt-bench/
├── commands/       # Will hold CLI command implementations
├── core/           # Will hold core framework logic
├── templates/      # Will hold template definitions
├── db/             # Will hold database operations
├── __tests__/      # Will hold unit tests
└── fixtures/       # Will hold test data
    └── images/     # Will hold test images
```

## Verification
```bash
ls -la prompt-bench/
# Should show: commands, core, templates, db, __tests__, fixtures
ls -la prompt-bench/fixtures/
# Should show: images
```

## Dependencies
- Phase 1 (Configuration) should be complete

## Next Phase
Phase 3: Move Files
