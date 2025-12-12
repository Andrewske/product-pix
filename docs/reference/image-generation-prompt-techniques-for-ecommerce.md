# AI image generation prompts for e-commerce product photography

**The most effective product photography prompts follow a consistent structure: Subject + Context + Lighting + Style + Technical specifications.** Google's Imagen 3 and Gemini models interpret natural language descriptions far better than keyword lists, making narrative-style prompts essential for your app. Research shows AI-generated product images can increase click-through rates by 15-17% and conversions by up to 157% when done correctly. The key differentiator between mediocre and professional results lies in using precise photography terminology—camera angles, lighting setups, and lens specifications—rather than vague descriptors.

## The anatomy of high-converting product prompts

Professional product photography prompts work best with a layered architecture that AI models can parse systematically. The most effective formula places elements in order of importance, since keywords at the beginning carry significantly more weight than those appearing later.

**Universal prompt formula:**
```
[Product description] + [Background/Surface] + [Lighting setup] + [Camera/Lens] + [Style modifiers] + [Quality terms]
```

**Optimal prompt length is 10-15 words** for product photography. Exceeding this causes AI models to deprioritize later elements or produce confused outputs. Stable Diffusion has a 75-token limit per processing chunk, and even models without hard limits perform better with focused prompts.

Syntax matters considerably. Use commas to separate descriptors rather than flowing sentences. Avoid politeness phrases ("Please generate...") and brand names the AI won't recognize. Instead of "Nike Air Max running shoe," use "white mesh running shoe with visible air cushion heel." Stable Diffusion users can apply weighting syntax—`(keyword:1.5)` increases importance while `(keyword:0.5)` decreases it.

The most successful practitioners avoid the term "photorealistic" entirely for product shots. Counter-intuitively, this keyword often produces a digitized, artificial appearance. Instead, use "studio lighting, product photography" or reference specific cameras ("shot on Hasselblad, 85mm lens") to trigger more authentic results.

## Platform requirements that shape prompt design

Amazon's main image requirements directly inform what your app's prompts must produce. Main images require a **pure white background (RGB 255,255,255)**, the product filling **85% or more of the frame**, no text or watermarks, and minimum **1,000 pixels** on the longest side for zoom functionality (2,000 pixels recommended). Products must appear outside packaging unless packaging is a key feature. For apparel specifically, women's and men's clothing must show on human models, while kids' and baby items must be photographed flat.

eBay follows similar principles with **1,600×1,600 pixels** optimal for zoom capability and a strong preference for square (1:1) aspect ratios. Original photos are required for used items—a constraint that limits pure AI generation but allows AI enhancement workflows.

Poshmark and fashion resale platforms enforce square formats automatically and allow up to 16 images per listing. The first image must show the actual item in possession, making AI useful primarily for background enhancement and secondary lifestyle shots rather than primary product generation.

These constraints mean your app should generate at consistent dimensions, default to square aspect ratios, and provide explicit options for "pure white background, product centered, fills 85% of frame" as the e-commerce default.

## Google's models require narrative descriptions

Imagen 3 and Gemini process prompts fundamentally differently than Midjourney or Stable Diffusion. **Google's models excel with natural language descriptions rather than keyword lists.** A narrative paragraph consistently produces better, more coherent results than disconnected terms.

Google officially recommends the **Subject + Context + Style** framework:
- **Subject**: The product with specific details ("minimalist ceramic mug in matte black")
- **Context**: Where it's placed ("on polished concrete surface in studio")
- **Style**: Aesthetic approach ("professional e-commerce photography, studio lighting")

Gemini 2.5 Flash handles six elements particularly well: subject, composition, action, location, style, and editing instructions. For product photography, always specify camera proximity ("close-up," "full product shot"), lighting quality ("soft diffused studio lighting"), and technical style ("commercial photography, 4K, sharp focus").

**Imagen 3's key advantage for e-commerce** is its dedicated `product-image` edit mode with `mask_mode="background"` through the Vertex AI API. This enables programmatic background replacement while preserving the original product—ideal for transforming ordinary photos into professional listings. The `product_position` parameter offers "fixed" (maintain position) or "reposition" (allow AI optimization) modes.

Google recommends keeping text in images to **25 characters or fewer** and using only 2-3 distinct text phrases maximum. Text rendering remains imperfect across all models, so your app should handle text overlays separately rather than generating them within AI images.

For negative prompts, Google advises describing what you don't want plainly ("wall, frame") rather than using instructive language ("no walls"). This subtle distinction significantly affects output quality.

## Lighting terminology that transforms output quality

The difference between amateur and professional AI-generated product photos often comes down to lighting specification. AI models trained on labeled photography datasets respond precisely to industry terminology.

**Essential lighting terms for e-commerce:**

| Setup | Prompt terminology | Best for |
|-------|-------------------|----------|
| Clean studio | "soft diffused studio lighting, softbox" | Primary e-commerce shots |
| High-key | "high-key lighting, bright and airy, minimal shadows" | White background products |
| Low-key dramatic | "low-key lighting, spotlight on product, dark background" | Luxury items, jewelry |
| Three-point | "three-point lighting, key light at 45 degrees, fill light" | Dimensional products |
| Rim/edge | "subtle rim lighting, product separation from background" | Glass, electronics |

**Camera and lens terms** add professional authenticity: "shot on Canon 5D, 85mm f/1.4 lens" or "macro lens, 100mm, sharp focus on details." Including aperture references like "f/8 for sharp focus throughout" or "shallow depth of field, bokeh background" gives precise control over the final look.

Quality modifiers that consistently improve results include "4K," "HDR," "studio photo," and "commercial photography." For maximum photorealism, reference film stocks ("Kodak Portra 400") rather than digital processes.

## Negative prompts refine without overcomplicating

Negative prompts tell the AI what to exclude, and they're essential for clean product photography. However, overloading negative prompts degrades overall quality.

**Universal quality negatives for product photography:**
```
worst quality, low quality, blurry, pixelated, watermark, text, signature, logo, noisy, grainy, overexposed, poorly drawn
```

**Product-specific negatives:**
```
extra reflections, glare, harsh hotspot, busy background, cluttered, distorted
```

For Midjourney, use the `--no` parameter: `--no background, text, watermarks`. Start with minimal negatives and add only when specific problems appear in generated images. Testing each negative term individually helps identify which actually improve your specific use case.

## Category-specific prompting strategies

### Apparel and clothing
The primary challenge is showing fit, fabric texture, and accurate colors. Specify fabric type explicitly: "brushed cotton henley," "structured wool blazer," "flowing chiffon dress." Include color precision—"navy cotton" not "blue shirt."

**Template for apparel:**
```
Professional e-commerce photo of [garment with fabric], on seamless white studio backdrop, soft studio softbox lighting at 45 degrees, neutral daylight color temperature, product centered filling 70% of frame, sharp fabric texture visible, color-accurate
```

For flat-lay clothing shots, add "laid flat on white surface, overhead shot, no wrinkles, steamed."

### Jewelry and small goods
Reflective surfaces require specialized handling. Use "large diffusion tent lighting, controlled specular highlights" to prevent harsh hotspots. Specify surface materials explicitly: "black velvet cushion," "white Carrara marble," "polished obsidian."

**Template for jewelry:**
```
Luxury product photography of [jewelry piece], on [surface material], soft diffused lighting with subtle rim light for sparkle, dark gradient background, minimal reflections, ultra-sharp macro focus on center stone, commercial advertising quality
```

Add "reflection_intensity: subtle and elegant" as a conceptual constraint when building your prompt system.

### Electronics and tech
Tech products benefit from minimalist settings. Use "modern minimalist workspace," "sleek futuristic setting with metallic surfaces," or "clean desk setup with natural window light." For dynamic marketing shots, "smartphone in motion blur, bustling city backdrop" creates energy.

### Food and beverage
Focus on freshness and appetite appeal. Use sensory descriptors: "glistening," "steaming," "fresh droplets." Include camera specifics: "shot using Hasselblad, ISO 100, food magazine photography." For beverages, "condensation on glass, cold lighting, refreshing atmosphere."

## Template structures for parameterized prompts

Your app can use structured templates with replaceable parameters. The most effective pattern separates consistent brand elements from variable product-specific elements.

**E-commerce hero shot template:**
```
Professional e-commerce photo of {product_name}, {product_color} {product_material}, on pure white seamless background RGB 255 255 255, soft diffused studio lighting with subtle fill light, shot on DSLR with 85mm lens f/8, product centered filling 85% of frame, sharp focus throughout, commercial catalog quality, 1:1 square aspect ratio
```

**Lifestyle context template:**
```
{product_name} in {setting}, {surrounding_props}, {lighting_type} lighting, {mood} atmosphere, lifestyle photography, shallow depth of field, authentic feel, product clearly visible taking 40% of frame
```

**Parameterized JSON structure for API integration:**
```json
{
  "subject": "{product_description}",
  "background": "pure white seamless",
  "lighting": {
    "type": "soft studio softbox",
    "direction": "45-degree key with fill",
    "color_temp": "neutral daylight 5500K"
  },
  "camera": {
    "lens": "85mm",
    "aperture": "f/8",
    "distance": "product fills 85%"
  },
  "constraints": {
    "preserve_product": true,
    "color_accuracy": "critical"
  }
}
```

## Common failures and proven solutions

**Problem: Product doesn't match the actual item**
Solution: Use image-to-image workflows. Generate the background separately, remove AI's product placeholder, then composite the real product photo. Tools like ControlNet's Depth model maintain product contours during integration.

**Problem: Inconsistent style across product catalog**
Solution: Lock exact prompt wording—"soft diffused studio lighting" every time, never variations. Use Midjourney's `--sref` parameter for style references or save generation seeds for reproducibility.

**Problem: Text and logos don't render correctly**
Solution: Generate image without text first, then add text in post-processing. For simple text, generate with clean background, then use "vary region" tools to modify only the background while preserving text.

**Problem: Artifacts and quality issues**
Solution: Use minimum 1024×1024 pixel source images. Add "no artifacts, smooth result, professional quality" to prompts. Apply AutoAdjust nodes for color correction in Stable Diffusion workflows.

## Measured results from production implementations

Alibaba's personalized product image system achieved **15.58% increase in CTR** and **17.27% improvement in conversion rate** using AI-generated fashion images. The key innovation: prompts generated different styles for different stores based on historical merchant preferences.

Milaner luxury fashion brand reported **40% higher engagement** and **157% conversion improvement** using AI-generated on-model imagery, with 5× speed increase and 75% cost reduction compared to traditional shoots.

IKEA reduced primary photoshoots from 500+ annually to under 100, using AI to render all configurable product variations while maintaining consistent brand style standards across thousands of derivative images.

Amazon sellers report replacing $1,500+ photo shoots with AI-generated image decks created in single afternoons for approximately $20/month in tool subscriptions. The critical insight: main images remain real photographs, while AI generates supporting lifestyle images, infographics, and A+ content.

## Workflow recommendations for your app

**For background replacement (highest impact):**
1. Accept user's product photo
2. Use BiRefNet or similar for precise background removal
3. Generate new background with Imagen 3's product-image edit mode
4. Apply lighting adjustment prompts to match product to scene
5. Output at platform-required specifications (2000×2000 for Amazon)

**For full scene generation:**
1. User provides product reference image
2. App generates structured prompt from product category templates
3. Imagen 3 generates scene with product placeholder
4. Composite actual product, using inpainting for seamless integration
5. Apply consistent color correction across catalog

**For lifestyle images:**
1. Extract product from original photo
2. Generate contextual background matching target demographic
3. Use Gemini's multi-image composition for natural product placement
4. Maintain product taking 40%+ of frame for e-commerce requirements

**Quality control checkpoints:**
- Product fills 85% of frame (main images) or 40%+ (lifestyle)
- Pure white background reads as RGB 255,255,255
- No text, watermarks, or artifacts
- Aspect ratio matches target platform
- Resolution meets minimum 1600px for zoom functionality

## Conclusion

Building effective prompts for e-commerce product photography requires understanding that AI models are trained on professional photography datasets and respond best to precise industry terminology. Google's models specifically favor narrative descriptions over keyword lists, with the Subject + Context + Style framework producing optimal results. The most successful implementations treat AI as a background generation and enhancement tool rather than expecting it to accurately generate products from scratch—composite workflows combining real product photos with AI-generated environments deliver both accuracy and professional quality. Your app should parameterize the consistent elements (lighting setup, camera specifications, quality modifiers) while allowing variation in contextual elements (backgrounds, props, seasonal themes), enabling catalog-wide consistency with engaging variety.