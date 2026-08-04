/**
 * shadcn/ui expects `cn` to live at the `@/lib/utils` alias declared in
 * components.json. The implementation lives in `@/utils/cn` with the rest of
 * the shared helpers; this file only re-exports it so generated components
 * resolve without edits.
 */
export { cn } from '@/utils/cn'
