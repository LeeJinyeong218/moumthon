# Playwright Testing Agent Instructions

## Overview

This document defines the conventions and rules for writing Playwright test specs in this project.
Always follow these rules before writing any `.spec.ts` file.

---

## 1. Element Selection — `data-testid` Only

**All element access must use `data-testid`.** Never use CSS class selectors, tag names, or text-based selectors.

### Naming Convention

```
{page}-{feature}-{ui-name}
```

| Segment    | Description                              | Example             |
| ---------- | ---------------------------------------- | ------------------- |
| `page`     | Page or route the element belongs to     | `login`, `dashboard`, `mypage` |
| `feature`  | Feature or section within the page       | `auth`, `profile`, `post-list` |
| `ui-name`  | Specific UI element role                 | `submit-btn`, `email-input`, `error-msg` |

### Examples

```
login-auth-email-input
login-auth-password-input
login-auth-submit-btn
login-auth-error-msg

dashboard-post-list-item
dashboard-post-list-empty-msg

mypage-profile-avatar-img
mypage-profile-edit-btn
```

### Adding `data-testid` to Components

If a target element does not have a `data-testid`, add it directly to the component source.

```tsx
// Before
<button onClick={handleSubmit}>로그인</button>

// After
<button data-testid="login-auth-submit-btn" onClick={handleSubmit}>
  로그인
</button>
```

```tsx
// Input example
<input
  data-testid="login-auth-email-input"
  type="email"
  value={email}
  onChange={handleChange}
/>
```

### Locator Usage in Spec

```ts
const submitBtn = page.getByTestId('login-auth-submit-btn');
const emailInput = page.getByTestId('login-auth-email-input');
```

> ❌ Never use: `page.locator('.btn-primary')`, `page.getByText('로그인')`, `page.locator('button')`

---

## 2. Data State Verification — `localStorage`

All data change assertions must read from `localStorage`, not from DOM text or network responses.

### Reading a Value

```ts
const raw = await page.evaluate(() => localStorage.getItem('KEY_NAME'));
const data = JSON.parse(raw ?? 'null');
expect(data).toMatchObject({ ... });
```

### Common Patterns

```ts
// Assert a value was saved
const saved = await page.evaluate(() => localStorage.getItem('user-profile'));
expect(JSON.parse(saved!)).toMatchObject({ nickname: '진영' });

// Assert a key was removed
const removed = await page.evaluate(() => localStorage.getItem('auth-token'));
expect(removed).toBeNull();

// Assert list length increased
const list = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('post-list') ?? '[]')
);
expect(list).toHaveLength(3);
```

### Helper (recommended — place in `tests/helpers/storage.ts`)

```ts
export async function getStorage<T>(page: Page, key: string): Promise<T | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  return raw ? (JSON.parse(raw) as T) : null;
}
```

Usage:

```ts
import { getStorage } from '../helpers/storage';

const profile = await getStorage<UserProfile>(page, 'user-profile');
expect(profile?.nickname).toBe('진영');
```

---

## 3. Test Description Format

When a test prompt is requested, every `test()` description must indicate one of the following tags:

| Tag        | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `[필수]`   | Core flow — must always pass                        |
| `[옵션]`   | Optional behavior — conditional or edge case        |
| `[자체]`   | Internal/self-contained logic — no external trigger |

### Format

```
[태그] 테스트 설명
```

### Examples

```ts
test('[필수] 이메일과 비밀번호 입력 후 로그인 성공 시 토큰이 localStorage에 저장된다', ...);
test('[옵션] 자동 로그인 체크 시 remember-me 값이 localStorage에 true로 저장된다', ...);
test('[자체] 페이지 진입 시 localStorage에 방문 기록이 자동으로 기록된다', ...);
```

---

## 4. Full Spec Example

```ts
import { test, expect } from '@playwright/test';
import { getStorage } from '../helpers/storage';

test.describe('로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('[필수] 유효한 정보 입력 후 로그인 시 auth-token이 localStorage에 저장된다', async ({ page }) => {
    await page.getByTestId('login-auth-email-input').fill('test@example.com');
    await page.getByTestId('login-auth-password-input').fill('password123');
    await page.getByTestId('login-auth-submit-btn').click();

    const token = await getStorage<string>(page, 'auth-token');
    expect(token).toBeTruthy();
  });

  test('[필수] 잘못된 비밀번호 입력 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.getByTestId('login-auth-email-input').fill('test@example.com');
    await page.getByTestId('login-auth-password-input').fill('wrongpassword');
    await page.getByTestId('login-auth-submit-btn').click();

    await expect(page.getByTestId('login-auth-error-msg')).toBeVisible();
  });

  test('[옵션] 자동 로그인 체크 시 remember-me가 localStorage에 저장된다', async ({ page }) => {
    await page.getByTestId('login-auth-remember-checkbox').check();
    await page.getByTestId('login-auth-submit-btn').click();

    const remember = await getStorage<boolean>(page, 'remember-me');
    expect(remember).toBe(true);
  });

  test('[자체] 페이지 진입 시 이전 에러 상태가 초기화된다', async ({ page }) => {
    await expect(page.getByTestId('login-auth-error-msg')).not.toBeVisible();
  });
});
```

---

## 5. on/off 상태 확인

토글, 스위치처럼 on/off 디자인이 나뉘는 컴포넌트는 아래 우선순위로 상태를 확인한다.

### 우선순위

1. **`data-state` 속성** (Radix UI / shadcn 계열 — 자동으로 붙음)
2. **`aria-*` 속성** (접근성 속성이 이미 존재하는 경우)
3. **스타일 직접 비교는 지양** (디자인 변경에 취약)

### 현재 컴포넌트에 붙은 속성 확인 방법

```ts
const attrs = await page.getByTestId('mypage-setting-toggle').evaluate(el =>
  [...el.attributes].map(a => `${a.name}="${a.value}"`).join('\n')
);
console.log(attrs);
```

### 검증 예시

```ts
// data-state 방식
await expect(page.getByTestId('mypage-setting-toggle')).toHaveAttribute('data-state', 'on');

// aria-checked 방식
await expect(page.getByTestId('mypage-setting-toggle')).toHaveAttribute('aria-checked', 'true');
```

---

## 6. Quick Reference

```
요소 접근        → getByTestId('{page}-{feature}-{ui-name}')
데이터 검증      → localStorage 직접 읽기 (getStorage helper 사용)
상태 검증        → data-state 또는 aria-* 속성
testid 없으면    → 컴포넌트에 직접 data-testid 추가
테스트 설명      → [필수] / [옵션] / [자체] 태그 명시
```
