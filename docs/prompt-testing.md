# Prompt Testing Quick Reference

## Workflow

```
Templates → Generate → Evaluate → Compare/Report
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm bench sync` | Sync templates from code to database |
| `pnpm bench run` | Generate test images with Gemini |
| `pnpm bench evaluate` | Score images with Claude (1-10) |
| `pnpm bench report` | View batch statistics |
| `pnpm bench compare` | A/B test two batches |

---

## Step-by-Step

### 1. Sync Templates
Push template definitions to database.
```bash
pnpm bench sync
```

### 2. Run Tests
Generate images from a batch file.
```bash
pnpm bench run --template ecommerce-base --batch tests/fixtures/products-mix.json --label my-test
```

### 3. Evaluate
Score generated images with Claude.
```bash
pnpm bench evaluate --label my-test
```

### 4. Report
View summary statistics.
```bash
pnpm bench report --label my-test
```

### 5. Compare (A/B Test)
Compare two batches statistically.
```bash
pnpm bench compare --baseline control-batch --candidate new-prompt-batch
```

---

## Batch File Format

```json
[
  {
    "variables": {
      "product": "ceramic coffee mug",
      "color": "matte black",
      "background_type": "pure white seamless",
      "lighting_style": "soft diffused studio",
      "style": "commercial product"
    }
  }
]
```

---

## Available Templates

- `ecommerce-base` - Standard e-commerce product shots
- `lifestyle-product` - Lifestyle/context product photography
