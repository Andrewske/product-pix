# Cloudflare R2 CORS Configuration

**ProductPix.app — Quick Reference Guide**

---

## Overview

CORS (Cross-Origin Resource Sharing) must be configured on your R2 bucket to allow direct browser uploads via presigned URLs. Without proper CORS configuration, uploads will fail with a CORS error.

---

## Configuration Steps

### Method 1: Cloudflare Dashboard

1. **Navigate to R2**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select your account
   - Click **R2** in the sidebar
   - Click on your bucket (`productpix-images`)

2. **Open Settings**
   - Click the **Settings** tab

3. **Configure CORS**
   - Scroll to **CORS Policy**
   - Click **Edit CORS Policy**
   - Paste the following configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://productpix.app",
      "https://*.productpix.app"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "x-amz-*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

4. **Save**
   - Click **Save**

---

### Method 2: Wrangler CLI

1. **Create CORS configuration file**
   ```bash
   cat > r2-cors.json << 'EOF'
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://productpix.app",
         "https://*.productpix.app"
       ],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   EOF
   ```

2. **Apply configuration**
   ```bash
   npx wrangler r2 bucket cors put productpix-images --rules ./r2-cors.json
   ```

3. **Verify configuration**
   ```bash
   npx wrangler r2 bucket cors list productpix-images
   ```

---

## Configuration Explained

| Field | Value | Purpose |
|-------|-------|---------|
| `AllowedOrigins` | Your domains | Which domains can make requests |
| `AllowedMethods` | GET, PUT, HEAD | GET for downloads, PUT for uploads, HEAD for checks |
| `AllowedHeaders` | Content-Type, etc. | Headers the browser can send |
| `ExposeHeaders` | ETag | Headers the browser can read from response |
| `MaxAgeSeconds` | 3600 | How long to cache the CORS preflight (1 hour) |

---

## Development vs Production

### Development Only

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 300
  }
]
```

### Production

```json
[
  {
    "AllowedOrigins": [
      "https://productpix.app",
      "https://www.productpix.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Testing CORS

### Quick Test

```bash
# Test preflight request
curl -X OPTIONS "https://mefvvwykjdtmlfrptskt.supabase.co/test" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, PUT, HEAD
Access-Control-Allow-Headers: Content-Type
```

### Browser Test

```javascript
// Run in browser console
fetch('https://product-pics-1.r2.dev/test', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'PUT',
  }
}).then(r => console.log('CORS OK:', r.ok));
```

---

## Troubleshooting

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause:** CORS not configured or origin not in allowed list.

**Fix:**
1. Verify CORS is saved in R2 settings
2. Check that your origin (including port) is in `AllowedOrigins`
3. Make sure you're using the correct bucket URL

### Error: "Method not allowed"

**Cause:** The HTTP method isn't in `AllowedMethods`.

**Fix:** Add the method (e.g., `PUT` for uploads) to `AllowedMethods`.

### Error: "Header not allowed"

**Cause:** A request header isn't in `AllowedHeaders`.

**Fix:** Add the header to `AllowedHeaders` or use `"*"` for development.

### Preflight Succeeds but Upload Fails

**Cause:** Usually a bucket permissions issue, not CORS.

**Fix:**
1. Check R2 API token has write permissions
2. Verify presigned URL is valid
3. Check file size limits

---

## Security Notes

1. **Never use `"*"` for AllowedOrigins in production** — always specify exact domains

2. **Minimize AllowedMethods** — only include methods you actually need

3. **Review AllowedHeaders** — only allow headers your application sends

4. **Set reasonable MaxAgeSeconds** — balance between performance and flexibility

---

## Quick Reference

```bash
# List current CORS rules
npx wrangler r2 bucket cors list productpix-images

# Update CORS rules
npx wrangler r2 bucket cors put productpix-images --rules ./r2-cors.json

# Delete CORS rules (resets to default deny)
npx wrangler r2 bucket cors delete productpix-images
```
