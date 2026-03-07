

# Hide Engineering, Compliance & Knowledge Base

Comment out (not delete) the Engineering and Compliance features so they can be restored later. Also fix the build error.

## 1. Fix build error: `auth-send-email/index.ts`

Line 2: Change `import { Resend } from "npm:resend@2.0.0"` to use the esm.sh pattern like line 1:
```ts
import { Resend } from "https://esm.sh/resend@2.0.0";
```

## 2. Hide Engineering & Compliance cards from Sidebar

**`src/components/dashboard/Sidebar.tsx`** (~lines 389-461): Comment out the entire "Tool Buttons - Card Grid" `SidebarGroup` block containing both the Engineering and Compliance card buttons.

## 3. Comment out routes in App.tsx

**`src/App.tsx`**: Comment out these 3 routes (lines ~94-97):
- `/engineering`
- `/compliance`  
- `/engineering/grading`

Keep the lazy imports commented out too (lines ~42-45).

## 4. Delete unused knowledge base files

These files have zero imports anywhere in the codebase:
- `src/lib/knowledgeBase/codeComparison.ts`
- `src/lib/knowledgeBase/codeQuickReference.ts`

## What stays untouched

- The AynEyeIcon component — only used in admin marketing panels (BrandKit, CreativeEditor, etc.), not in the main user-facing UI
- All engineering page/component files — kept for later re-enabling
- Edge functions for engineering — kept for later

