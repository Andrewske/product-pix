# Active Context

## Current Focus
- Redesigning the application UI to match new "Dark + Warm" aesthetic.
- Fixed critical Tailwind v4 configuration issue where color variables were not mapped to theme utilities, causing the app to appear "black and white".

## Recent Decisions
- **Theme Configuration**: Explicitly mapped all shadcn color variables (background, foreground, primary, etc.) in `globals.css` `@theme` block. This ensures classes like `bg-primary` correctly resolve to the Electric Coral color.

## Active Tasks
- Verify UI visually (User Action).
- Ensure all components are picking up the new colors.
