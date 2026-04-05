# AGENTS.md

## Stack
Next.js App Router, TypeScript, Tailwind CSS, @base-ui/react, class-variance-authority, Zustand.

## File Placement
- New route → `src/app/<route>/page.tsx`
- Reusable UI → `src/components/common/<Name>.tsx`
- Feature component → `src/components/feature/<feature>/<Name>.tsx`
- Custom hook → `src/hooks/use<Name>.ts`
- Utility → `src/libs/<name>.ts`
- Storage accessor → `src/libs/storage/<name>.ts`
- Global state → `src/stores/<domain>Store.ts`
- Playwright test → `e2e/<name>.spec.ts`

## Naming
- Components: PascalCase
- Hooks: `use<Name>.ts`
- Stores: `<domain>Store.ts`
- Dynamic segments: bracket notation `[slug]`

---

## Read these docs based on the task

**페이지를 새로 만들거나 라우팅/링크가 관련된 경우**
→ read `docs/routing.md`

**레이아웃, GNB, 페이지 구조를 다루는 경우**
→ read `docs/layout.md`

**컴포넌트를 만들거나 수정하는 경우**
→ read `docs/components.md`

**스타일링, 색상, Tailwind 클래스를 작성하는 경우**
→ read `docs/styling.md`

**데이터를 다루거나 타입이 필요한 경우**
→ read `docs/data.md`

**초기 데이터 추가/수정이 필요한 경우**
→ read `docs/seed.md`

**테스트를 작성하는 경우**
→ read `docs/playwright.md`