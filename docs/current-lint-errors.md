product-pix main  ? ✗ bun run lint
$ eslint --cache

/home/kevin/coding/product-pix/middleware.ts
  1:35  warning  'CookieOptions' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/contact/__tests__/route.test.ts
  19:29  warning  'params' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/cookie-consent/route.ts
  6:8   warning  Missing return type on function                                            @typescript-eslint/explicit-function-return-type
  6:27  warning  'request' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/cron/analyze-sentiment/__tests__/route.test.ts
    3:10  warning  'createFromMock' is defined but never used. Allowed unused vars must match /^_/u                                     @typescript-eslint/no-unused-vars
  138:7   error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  269:7   error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  377:7   error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  408:7   error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment

/home/kevin/coding/product-pix/src/app/api/cron/analyze-sentiment/route.ts
  1:10  warning  'NextRequest' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/generate/route.ts
  3:8  warning  'crypto' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/images/[id]/feedback/__tests__/route.test.ts
  102:13  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/app/api/messages/[id]/__tests__/route.test.ts
  81:7   error  Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  85:13  error  Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment

/home/kevin/coding/product-pix/src/components/__tests__/generation-result.test.tsx
  42:5  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

/home/kevin/coding/product-pix/src/components/__tests__/image-card.test.tsx
  35:5  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

/home/kevin/coding/product-pix/src/components/admin/__tests__/user-timeline.test.tsx
  145:11  warning  'user' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/components/cookie-consent/__tests__/cookie-consent-provider.test.tsx
  2:10  warning  'render' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  2:39  warning  'act' is defined but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/hooks/__tests__/use-image-feedback.test.tsx
  4:10  warning  'toast' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/hooks/use-image-feedback.tsx
  135:14  warning  '_error' is defined but never used  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/lib/analytics/posthog-provider.tsx
  15:7  error    Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free  @typescript-eslint/ban-ts-comment
  42:5  warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/exhaustive-deps')

/home/kevin/coding/product-pix/src/lib/auth/__tests__/hooks.test.ts
  1:38  warning  'beforeEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/lib/auth/hooks.ts
   6:10  warning  'logger' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  80:11  error    Unexpected console statement. Only these console methods are allowed: warn, info  no-console

/home/kevin/coding/product-pix/src/lib/cookie-consent/__tests__/storage.test.ts
  5:3  warning  'clearLocalStorageConsent' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/lib/cookie-consent/storage.ts
   2:30  warning  'UserPreferences' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  12:5   error    Unexpected console statement. Only these console methods are allowed: warn, info   no-console
  23:5   error    Unexpected console statement. Only these console methods are allowed: warn, info   no-console
  32:5   error    Unexpected console statement. Only these console methods are allowed: warn, info   no-console
  54:5   error    Unexpected console statement. Only these console methods are allowed: warn, info   no-console

/home/kevin/coding/product-pix/src/lib/cookie-consent/sync.ts
  30:5  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console

/home/kevin/coding/product-pix/src/lib/db/admin-messages.ts
    7:11  warning  'UserMessagesTable' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   93:13  error    Unexpected any. Specify a different type                                             @typescript-eslint/no-explicit-any
  188:13  error    Unexpected any. Specify a different type                                             @typescript-eslint/no-explicit-any

/home/kevin/coding/product-pix/src/lib/db/admin-timeline.ts
    5:15  warning  'Database' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
   51:28  error    Unexpected any. Specify a different type                                    @typescript-eslint/no-explicit-any
   89:44  error    Unexpected any. Specify a different type                                    @typescript-eslint/no-explicit-any
  109:72  error    Unexpected any. Specify a different type                                    @typescript-eslint/no-explicit-any

/home/kevin/coding/product-pix/src/lib/logging/index.ts
  72:9  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console
  81:9  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console

/home/kevin/coding/product-pix/src/lib/observability/capture-error-client.ts
  24:3  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console
  41:5  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console

/home/kevin/coding/product-pix/src/lib/request/context.ts
   8:22  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  10:34  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  22:47  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/kevin/coding/product-pix/src/lib/test-utils/supabase-mocks.ts
   90:19  warning  'columns' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
   91:19  warning  'values' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
   92:19  warning  'values' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  144:19  warning  'columns' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
  145:19  warning  'values' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars
  146:19  warning  'values' is defined but never used. Allowed unused args must match /^_/u   @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/lib/test-utils/test-import.ts
  1:10  warning  'createSupabaseMock' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/kevin/coding/product-pix/src/lib/toast/index.ts
  27:42  error  Unexpected console statement. Only these console methods are allowed: warn, info  no-console

✖ 55 problems (26 errors, 29 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.

error: script "lint" exited with code 1
