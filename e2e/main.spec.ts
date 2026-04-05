import { test, expect } from '@playwright/test';

test.describe('메인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('[필수] 해커톤 탐색 버튼 클릭 시 /hackathons로 이동한다', async ({ page }) => {
    await page.getByTestId('home-cta-hackathon-btn').click();
    await expect(page).toHaveURL('/hackathons');
  });

  test('[필수] 팀 찾기 버튼 클릭 시 /camp로 이동한다', async ({ page }) => {
    await page.getByTestId('home-cta-team-btn').click();
    await expect(page).toHaveURL('/camp');
  });

  test('[필수] 랭킹 보기 버튼 클릭 시 /rankings로 이동한다', async ({ page }) => {
    await page.getByTestId('home-cta-ranking-btn').click();
    await expect(page).toHaveURL('/rankings');
  });

  test('[필수] 페이지 진입 시 3개의 CTA 버튼이 모두 노출된다', async ({ page }) => {
    await expect(page.getByTestId('home-cta-hackathon-btn')).toBeVisible();
    await expect(page.getByTestId('home-cta-team-btn')).toBeVisible();
    await expect(page.getByTestId('home-cta-ranking-btn')).toBeVisible();
  });
});
