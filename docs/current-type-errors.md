product-pix main  ? ✗ bun run tsc
src/app/api/admin/users/[userId]/timeline/route.ts:33:7 - error TS2322: Type 'string | null' is not assignable to type 'string | undefined'.
  Type 'null' is not assignable to type 'string | undefined'.

33       cursor,
         ~~~~~~

  src/lib/db/admin-timeline.ts:32:5
    32     cursor?: string;
           ~~~~~~
    The expected type comes from property 'cursor' which is declared here on type '{ limit: number; cursor?: string | undefined; filters?: TimelineFilters | undefined; }'

src/components/__tests__/image-card.test.tsx:62:5 - error TS2353: Object literal may only specify known properties, and 'refunded_at' does not exist in type '{ created_at: string; deleted_at: string | null; file_key: string; file_size: number | null; height: number | null; id: string; is_favorite: boolean; job_id: string; public_url: string; title: string | null; user_id: string; width: number | null; }'.

62     refunded_at: null,
       ~~~~~~~~~~~

src/components/admin/__tests__/timeline-filters.test.tsx:22:31 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

22       render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                                 ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:27:51 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

27     const { container } = render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                                                     ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:39:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

39     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                               ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:55:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

55     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                               ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:72:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

72     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                               ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:84:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

84     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                               ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:96:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

96     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                               ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:110:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

110     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                                ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:124:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

124     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                                ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:138:29 - error TS2741: Property 'types' is missing in type '{ severity: undefined; domain: undefined; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

138     render(<TimelineFilters filters={defaultFilters} onChange={mockOnChange} />);
                                ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/__tests__/timeline-filters.test.tsx:158:29 - error TS2741: Property 'types' is missing in type '{ severity: "high"; domain: "payment"; resolved: "all"; days: number; }' but required in type '{ types: string[]; startDate?: string | undefined; endDate?: string | undefined; }'.

158     render(<TimelineFilters filters={filtersWithValues} onChange={mockOnChange} />);
                                ~~~~~~~

  src/components/admin/timeline-filters.tsx:14:5
    14     types: string[];
           ~~~~~
    'types' is declared here.
  src/components/admin/timeline-filters.tsx:13:3
    13   filters: {
         ~~~~~~~
    The expected type comes from property 'filters' which is declared here on type 'IntrinsicAttributes & TimelineFiltersProps'

src/components/admin/user-timeline.tsx:19:23 - error TS2554: Expected 1 arguments, but got 0.

19   const observerRef = useRef<IntersectionObserver>();
                         ~~~~~~

  node_modules/@types/react/index.d.ts:1728:24
    1728     function useRef<T>(initialValue: T): RefObject<T>;
                                ~~~~~~~~~~~~~~~
    An argument for 'initialValue' was not provided.

src/lib/auth/__tests__/hooks.test.ts:51:7 - error TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type '{ created_at: string; credit_balance: number; display_name: string | null; email: string; id: string; is_admin: boolean; last_active_at: string | null; preferences: Json; stripe_customer_id: string | null; tier: "free" | ... 1 more ... | "business"; updated_at: string; }'.

51       deleted_at: null,
         ~~~~~~~~~~

src/lib/auth/__tests__/hooks.test.ts:99:7 - error TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type '{ created_at: string; credit_balance: number; display_name: string | null; email: string; id: string; is_admin: boolean; last_active_at: string | null; preferences: Json; stripe_customer_id: string | null; tier: "free" | ... 1 more ... | "business"; updated_at: string; }'.

99       deleted_at: null,
         ~~~~~~~~~~

src/lib/auth/__tests__/hooks.test.ts:147:7 - error TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type '{ created_at: string; credit_balance: number; display_name: string | null; email: string; id: string; is_admin: boolean; last_active_at: string | null; preferences: Json; stripe_customer_id: string | null; tier: "free" | ... 1 more ... | "business"; updated_at: string; }'.

147       deleted_at: null,
          ~~~~~~~~~~

src/lib/auth/__tests__/hooks.test.ts:213:7 - error TS2353: Object literal may only specify known properties, and 'deleted_at' does not exist in type '{ created_at: string; credit_balance: number; display_name: string | null; email: string; id: string; is_admin: boolean; last_active_at: string | null; preferences: Json; stripe_customer_id: string | null; tier: "free" | ... 1 more ... | "business"; updated_at: string; }'.

213       deleted_at: null,
          ~~~~~~~~~~

src/lib/db/jobs.ts:21:5 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.

21     p_upload_id: uploadId ?? undefined,
       ~~~~~~~~~~~

src/lib/r2/cleanup.ts:71:23 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(relation: "users" | "batch_jobs" | "batch_feedback" | "generated_images" | "prompt_templates" | "stripe_purchases" | "jobs" | "uploads" | "prompt_tests" | "user_messages" | "template_improvement_sessions" | ... 16 more ... | "user_activity"): PostgrestQueryBuilder<...>', gave the following error.
    Argument of type '"account_deletion_audit"' is not assignable to parameter of type '"users" | "batch_jobs" | "batch_feedback" | "generated_images" | "prompt_templates" | "stripe_purchases" | "jobs" | "uploads" | "prompt_tests" | "user_messages" | "template_improvement_sessions" | ... 16 more ... | "user_activity"'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder<{ PostgrestVersion: "12"; }, { Tables: { batch_feedback: { Row: { batch_id: string; comment: string | null; created_at: string; id: string; rating: number; reasons: string[]; updated_at: string; user_id: string; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 26 more ...; users: { ...; }; }; Views: {}; Functions: { ...; }; Enums: { ...; }; CompositeTypes: {}; }, never, never, never>', gave the following error.
    Argument of type '"account_deletion_audit"' is not assignable to parameter of type 'never'.

71   await supabase.from('account_deletion_audit').insert({
                         ~~~~~~~~~~~~~~~~~~~~~~~~


src/lib/r2/cleanup.ts:71:49 - error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: { batch_id: string; comment?: string | null | undefined; created_at?: string | undefined; id?: string | undefined; rating: number; reasons?: string[] | undefined; updated_at?: string | undefined; user_id: string; } | ... 26 more ... | { ...; }, options?: { ...; } | undefined): PostgrestFilterBuilder<...>', gave the following error.
    Object literal may only specify known properties, and 'r2_files_queued' does not exist in type '{ batch_id: string; comment?: string | null | undefined; created_at?: string | undefined; id?: string | undefined; rating: number; reasons?: string[] | undefined; updated_at?: string | undefined; user_id: string; } | ... 26 more ... | { ...; }'.
  Overload 2 of 2, '(values: ({ batch_id: string; comment?: string | null | undefined; created_at?: string | undefined; id?: string | undefined; rating: number; reasons?: string[] | undefined; updated_at?: string | undefined; user_id: string; } | ... 26 more ... | { ...; })[], options?: { ...; } | undefined): PostgrestFilterBuilder<...>', gave the following error.
    Object literal may only specify known properties, and 'user_id' does not exist in type '({ batch_id: string; comment?: string | null | undefined; created_at?: string | undefined; id?: string | undefined; rating: number; reasons?: string[] | undefined; updated_at?: string | undefined; user_id: string; } | ... 26 more ... | { ...; })[]'.

71   await supabase.from('account_deletion_audit').insert({
                                                   ~~~~~~


src/lib/r2/cleanup.ts:73:18 - error TS2339: Property 'original_email' does not exist on type 'SelectQueryError<"column 'original_email' does not exist on 'users'.">'.

73     email: user?.original_email || '',
                    ~~~~~~~~~~~~~~


Found 22 errors in 7 files.

Errors  Files
     1  src/app/api/admin/users/[userId]/timeline/route.ts:33
     1  src/components/__tests__/image-card.test.tsx:62
    11  src/components/admin/__tests__/timeline-filters.test.tsx:22
     1  src/components/admin/user-timeline.tsx:19
     4  src/lib/auth/__tests__/hooks.test.ts:51
     1  src/lib/db/jobs.ts:21
     3  src/lib/r2/cleanup.ts:71
error: "tsc" exited with code 2