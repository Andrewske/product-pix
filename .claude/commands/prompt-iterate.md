# Prompt Iteration Assistant

You are helping the user iterate on AI prompt templates using an evolutionary optimization approach.

## Arguments
- `$ARGUMENTS` contains optional: template slug, session ID, or action

## Workflow

### Step 1: Determine Mode

Parse $ARGUMENTS to determine mode:
- If empty or "start": Ask user for template and batch file
- If looks like UUID (session ID): Resume that session
- If template slug: Start new session with that template
- If "list": Show all sessions
- If "status": Show current session status

### Step 2: For New Sessions

1. Ask user for template if not provided:
   ```
   Which template would you like to iterate on?
   Available: [list from `bun bench sync --list` or check prompt-bench/templates/]
   ```

2. Ask for initial batch file:
   ```
   Which batch file should I use for initial tests?
   ```

3. Create session:
   ```bash
   bun bench iterate --template <slug> --batch <file>
   ```

4. Capture session ID from output

### Step 3: For Existing Sessions

1. Load session status:
   ```bash
   bun bench iterate --session <id> --status
   ```

2. Display current state:
   ```
   ## Session Status: <id>

   Template: ecommerce-base v1
   Generation: 3/10
   Best Score: 8.7/10
   Trend: Improving (+0.25/gen)

   Recent History:
   - Gen 1: 8.1 → Gen 2: 8.4 (+0.3) → Gen 3: 8.7 (+0.3)
   ```

### Step 4: Run Tests if Needed

Check if current population has been evaluated. If not:
```bash
bun bench test --template <slug> --batch <generated-batch> --label <session-label>
```

### Step 5: Generate and Present Variations

1. Get structured insights (this happens automatically via iterate command)

2. Present variations to user in this format:

```
## Proposed Variations for Generation 4

Based on analysis of 8 tests (mean: 8.2, best: 8.7):

### Success Patterns Identified:
- "soft diffused lighting" in lighting (avg 8.6)
- "85% of frame" in quality (avg 8.4)

### Failure Patterns to Avoid:
- "harsh" in lighting (avg 6.2)
- "busy" in background (avg 5.8)

---

### Variation 1: Wording Mutation
**Confidence:** 80%
**Parent:** Best performer (8.7)
**Change:** Simplified lighting description

| Component | Current | Proposed |
|-----------|---------|----------|
| lighting | soft diffused studio lighting with soft fill | soft three-point studio lighting |
| quality | 4K resolution, sharp focus, product centered filling 85% of frame | 4K, tack-sharp focus, product filling 85% of frame |

**Rationale:** Removing redundant "soft" and simplifying technical terms often improves scores.

🟢 Recommend running

---

### Variation 2: Crossover
**Confidence:** 75%
**Parents:** #1 (8.7) + #3 (8.4)
**Change:** Combined best elements from top 2

| Component | Value |
|-----------|-------|
| subject | Professional e-commerce photo of {product} |
| background | on pure white infinity background |
| lighting | soft diffused rim lighting with fill |
| ... | ... |

**Rationale:** Parent 1 had best lighting, Parent 3 had best background description.

🟡 Worth testing

---

### Variation 3: Wild Card
**Confidence:** 55%
**Change:** Experimental dramatic lighting

| Component | Value |
|-----------|-------|
| lighting | dramatic side lighting with soft fill and subtle rim |
| style | high-end fashion catalog photography |
| ... | ... |

**Rationale:** Unexplored territory - dramatic lighting hasn't been tested yet.

🟠 Experimental

---

## Your Decision

Which variations would you like to run?

Options:
1. Run variation 1 only (safest)
2. Run variations 1 and 2 (recommended)
3. Run all variations (thorough)
4. Skip all and stop iteration
5. Add your own custom variation

You can also modify any variation before running.
```

### Step 6: Collect User Decision

Based on user response:
- **Run selected**: Generate batch file with approved variations
- **Modify**: Ask user what to change, update variation
- **Custom**: Ask user to describe their variation, generate templateData
- **Stop**: End session with summary

### Step 7: Execute Approved Variations

```bash
# Generate batch from variations (you'll need to create the JSON)
# Then run:
bun bench iterate --session <id> --execute
```

### Step 8: Show Results and Continue

After execution completes:
```
## Generation 4 Results

| Variation | Score | Delta |
|-----------|-------|-------|
| Wording mutation | 8.9 | +0.2 |
| Wild card | 7.8 | -0.9 |

Best this generation: 8.9 (new high!)
Mean: 8.35 (+0.15)

Convergence check: Not converged
- StdDev: 0.38 (threshold: 0.05)
- Improvement: Yes
- Generations remaining: 6

Continue to generation 5? (y/n)
```

### Step 9: Handle Convergence

When converged or user stops:
```
## Iteration Complete!

Final Results:
- Generations run: 5
- Best score achieved: 9.1/10 (Generation 4)
- Total improvement: +1.0 from baseline

Best Performing Prompt:
```
Professional e-commerce photo of {product}...
[full prompt]
```

Winning Patterns:
- Soft three-point studio lighting
- Pure white infinity background
- 85% frame fill

Session saved: iter-abc123
To resume later: /prompt-iterate iter-abc123
```

## Commands Reference

```bash
# Start new session
bun bench iterate --template <slug> --batch <file>

# Resume session
bun bench iterate --session <id>

# Show status
bun bench iterate --session <id> --status

# List sessions
bun bench iterate --list
```

## Tips for Users

- Start with small batches (4-8 tests) to iterate quickly
- Trust high-confidence variations (>75%)
- Always run at least one wild card per generation for exploration
- Stop when improvement plateaus for 2-3 generations
- Save winning prompts to your template registry