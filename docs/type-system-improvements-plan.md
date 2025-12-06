# Type System and Integration Improvements Plan

## Overview

During the implementation of the orchestrator module, several type system and integration issues were identified that impact code maintainability and developer experience. This plan outlines a systematic approach to address these issues.

## Issues Identified

### 1. Database vs Interface Field Name Conflicts
**Problem**: Supabase generated types use `snake_case` (e.g., `batch_label`, `completed_at`) while application interfaces use `camelCase` (e.g., `batchLabel`, `completedAt`).

**Impact**: Type errors when using database records with application interfaces, requiring type assertions.

### 2. Result Type Property Access
**Problem**: Inconsistent usage of `.value` vs `.data` for accessing successful Result values.

**Impact**: Runtime errors and confusion about Result type usage.

### 3. Missing Error Codes
**Problem**: New error codes needed for orchestrator functionality were missing from the error enum.

**Impact**: Incomplete error handling coverage.

### 4. Function Signature Mismatches
**Problem**: TypeScript reported incorrect parameter counts for some functions (e.g., `resolveSourceImage`).

**Impact**: Type assertions required to bypass strict checking.

### 5. Import Conflicts
**Problem**: Naming conflicts between imported and locally declared functions.

**Impact**: Import resolution issues and potential runtime errors.

### 6. Async Import Issues
**Problem**: Improper placement of async imports causing initialization problems.

**Impact**: Module loading issues and potential runtime failures.

## Improvement Plan

### Phase 1: Type System Standardization (High Priority)

#### 1.1 Database Type Mapping Strategy
**Objective**: Create consistent type mapping between database and application layers.

**Tasks**:
- [ ] Analyze current database schema and identify all snake_case fields
- [ ] Create database-specific types that mirror Supabase generated types
- [ ] Implement mapping functions: `dbToApp()` and `appToDb()`
- [ ] Update all database operations to use proper type conversions

**Files to modify**:
- `src/types/database.ts` - Add application-specific type mappings
- `src/lib/prompts/types.ts` - Ensure interfaces align with mapping strategy
- All database operation files (`src/lib/prompts/db/*.ts`)

**Estimated effort**: 2-3 days

#### 1.2 Result Type Consistency
**Objective**: Standardize Result type usage throughout the codebase.

**Tasks**:
- [ ] Audit all Result type usage in the codebase
- [ ] Create ESLint rule to enforce `.data` for Ok results
- [ ] Update documentation with Result type usage patterns
- [ ] Add type guards for Result checking

**Files to modify**:
- `src/lib/prompts/errors.ts` - Add usage documentation
- All files using Result types

**Estimated effort**: 1 day

### Phase 2: Error Handling Enhancement (Medium Priority)

#### 2.1 Comprehensive Error Code Coverage
**Objective**: Ensure all error scenarios have appropriate error codes.

**Tasks**:
- [ ] Audit all error scenarios in the codebase
- [ ] Add missing error codes to `ErrorCode` enum
- [ ] Update error creation functions to validate error codes
- [ ] Create error code documentation

**Files to modify**:
- `src/lib/prompts/errors.ts` - Expand error code enum
- All error creation sites

**Estimated effort**: 0.5 days

### Phase 3: Function Signature Standardization (Medium Priority)

#### 3.1 Function Interface Review
**Objective**: Ensure all function signatures are consistent and properly typed.

**Tasks**:
- [ ] Review all exported functions for parameter consistency
- [ ] Add overloads where appropriate (e.g., `resolveSourceImage`)
- [ ] Create interface definitions for complex function signatures
- [ ] Add JSDoc comments with parameter descriptions

**Files to modify**:
- `src/lib/prompts/source-image.ts` - Fix resolveSourceImage signatures
- All public API functions

**Estimated effort**: 1 day

### Phase 4: Import and Module Organization (Low Priority)

#### 4.1 Import Conflict Resolution
**Objective**: Eliminate naming conflicts and improve import organization.

**Tasks**:
- [ ] Audit all import statements for naming conflicts
- [ ] Implement consistent import aliasing strategy
- [ ] Create import organization guidelines
- [ ] Update barrel exports to prevent conflicts

**Files to modify**:
- `src/lib/prompts/index.ts` - Review barrel exports
- All files with import statements

**Estimated effort**: 0.5 days

#### 4.2 Module Initialization Cleanup
**Objective**: Ensure proper module loading and initialization.

**Tasks**:
- [ ] Remove async imports from module scope
- [ ] Implement proper lazy loading where needed
- [ ] Add module initialization checks
- [ ] Create module loading documentation

**Files to modify**:
- `src/lib/prompts/orchestrator.ts` - Fix async import issues
- All modules with initialization concerns

**Estimated effort**: 0.5 days

## Implementation Strategy

### Incremental Approach
1. **Start with Phase 1**: Type system issues have the highest impact on maintainability
2. **Phase 2**: Error handling improvements provide immediate value
3. **Phase 3**: Function signatures improve API usability
4. **Phase 4**: Import organization for long-term maintainability

### Testing Strategy
- [ ] Create unit tests for type mapping functions
- [ ] Add integration tests for database operations
- [ ] Implement type checking CI/CD validation
- [ ] Create migration tests for type changes

### Risk Mitigation
- **Backwards Compatibility**: Ensure all changes maintain existing API contracts
- **Gradual Rollout**: Implement changes in small, testable increments
- **Type Safety**: Use TypeScript's strict mode to catch issues early
- **Documentation**: Update all documentation to reflect changes

## Success Criteria

### Technical Metrics
- [ ] Zero type assertions in database operations
- [ ] 100% type coverage for public APIs
- [ ] No TypeScript errors in strict mode
- [ ] Consistent error code usage across modules

### Developer Experience
- [ ] Clear, actionable error messages
- [ ] Intuitive function signatures
- [ ] Comprehensive API documentation
- [ ] Predictable import behavior

## Timeline

- **Phase 1**: 2-3 weeks (high priority, high impact)
- **Phase 2**: 1 week (medium priority, medium impact)
- **Phase 3**: 1 week (medium priority, low impact)
- **Phase 4**: 1 week (low priority, low impact)

**Total estimated effort**: 4-6 weeks

## Next Steps

1. Create detailed implementation tickets for each phase
2. Set up automated type checking in CI/CD
3. Establish code review guidelines for type safety
4. Schedule regular type system health checks

---

*This plan was created following the implementation of the orchestrator module, which revealed these systemic issues. Addressing them will significantly improve code maintainability and developer experience.*</content>
<parameter name="filePath">docs/type-system-improvements-plan.md