# Joyful Splashing Flame: Multi-Angle Product Photo Generation

## Project Overview

This project implements and evaluates multi-angle product photo generation capabilities for AI-powered e-commerce photography. The goal is to enable users to generate diverse, consistent collections of professional product photos from single or multiple input images.

## Key Components

### 1. Collection-Level Evaluator
- Evaluates entire image collections rather than individual photos
- Measures **Consistency** (product identity preservation across angles)
- Measures **Variety** (meaningful differences in composition and perspective)
- Measures **Physical Plausibility** (geometric accuracy and lighting consistency)

### 2. Multi-Image Infrastructure
- Supports up to 14 reference images per generation using Gemini 3 Pro Image
- Product category detection for optimal angle selection
- Three generation strategies: category-based, AI-decided, and hybrid approaches
- Research-backed angle mappings for 9 product categories (apparel, footwear, electronics, furniture, beauty, food, tools, jewelry, generic)

### 3. Experimental Validation
Three-stage experimental approach to determine optimal generation strategies:

- **Stage 1**: Pilot study testing if multiple input images improve novel viewpoint generation
- **Stage 2**: Comparison of variety strategies (category-based vs AI-decided vs hybrid)
- **Stage 3**: Context strategy testing (optional, based on Stage 2 results)

## Success Criteria

### Quality Benchmarks
| Metric | Target Score | Rationale |
|--------|-------------|-----------|
| Per-image quality | ≥8.0/10 | Professional e-commerce standard |
| Collection consistency | ≥8.5/10 | Product identity maintained across all angles |
| Collection variety | ≥7.0/10 | Meaningful perspective differences |
| Physical plausibility | ≥8.0/10 | No geometric distortions or impossible angles |

### Technical Requirements
- [ ] Collection evaluator handles 2-10 images per evaluation
- [ ] Category detection accuracy >90% across product types
- [ ] All 9 product categories supported with research-backed angles
- [ ] Generation pipeline supports single and multi-image inputs
- [ ] Cost tracking and token usage monitoring
- [ ] CLI commands for evaluation and collection generation

### Experimental Validation
- [ ] Stage 1: Demonstrated effect of multi-image input on output quality
- [ ] Stage 2: Identified optimal variety strategy through A/B testing
- [ ] Stage 3: Context strategy evaluation (conditional based on Stage 2 results)
- [ ] Production configuration recommendation with cost analysis

## Production Implementation

Upon successful validation, implement:
- Collection entity in database schema
- API endpoints supporting multi-image input/output
- Progressive enhancement UI for collection generation
- Pricing model: 1 credit per output image

## Project Structure

```
docs/joyful-splashing-flame/
├── 01-collection-evaluator.md          # Collection evaluation implementation
├── 02-multi-image-infrastructure.md    # Core generation capabilities
├── 03-test-data-preparation.md         # Test data setup
├── 04-run-stage1-experiment.md         # Multi-input pilot study
├── 05-run-stage2-experiment.md         # Variety strategy comparison
├── 06-stage3-and-documentation.md      # Final validation & docs
├── results/                            # Experiment results (generated)
└── README.md                           # This file
```

## Dependencies

- Gemini 3 Pro Image API access
- Existing prompt-bench infrastructure
- Test image fixtures for various product categories
- Cost tracking and evaluation capabilities

## Risk Mitigation

- Pilot study (Stage 1) validates core hypothesis before full implementation
- Modular design allows fallback to single-image generation if needed
- Cost monitoring prevents unexpected API expense
- Category detection fallback to generic angles ensures robustness

## Timeline

1. **Foundation** (Week 1-2): Collection evaluator and infrastructure
2. **Validation** (Week 3): Stage 1 pilot study
3. **Optimization** (Week 4): Stage 2 strategy comparison
4. **Polish** (Week 5): Stage 3 if needed, final documentation
5. **Production** (Week 6): Implementation and deployment

## Success Metrics

- **Technical**: All quality benchmarks achieved with ≥80% success rate
- **User**: Collection generation improves product photography workflow
- **Business**: Positive ROI through increased user engagement and conversion
- **Innovation**: Advances state-of-the-art in AI product photography</content>
<parameter name="filePath">/home/kevin/coding/product-pix/.worktrees/prompt-bench/docs/joyful-splashing-flame/README.md