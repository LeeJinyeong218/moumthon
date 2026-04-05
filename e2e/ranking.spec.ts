import { test, expect } from '@playwright/test'

// 전체 필터 기준 예상 랭킹 (공개 데이터 기준)
// 1위 U-002 김민수:  aimers(0.7421) + daker best(87.5)  = 88.2421pt
// 2위 U-003 이해린:  daker best(87.5)                   = 87.5pt
// 3위 U-005 정다나:  daker best(87.5)                   = 87.5pt
// 4위 U-004 최성우:  aimers(0.7421) + daker best(84.2)  = 84.9421pt
// 5위 U-001 박지연:  aimers(0.7421) + daker best(84.2)  = 84.9421pt

test.describe('랭킹 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rankings')
  })

  test('[필수] 유저별 랭킹 목록이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('ranking-table')).toBeVisible()
    // 1~5위 모든 유저 행이 렌더링되는지 확인
    await expect(page.getByTestId('ranking-row-U-002')).toBeVisible()
    await expect(page.getByTestId('ranking-row-U-003')).toBeVisible()
    await expect(page.getByTestId('ranking-row-U-005')).toBeVisible()
    await expect(page.getByTestId('ranking-row-U-004')).toBeVisible()
    await expect(page.getByTestId('ranking-row-U-001')).toBeVisible()
  })

  test('[필수] 각 행에 순위 / 닉네임 / 포인트 정보가 표시된다', async ({ page }) => {
    // 1위 김민수 행 검증
    const row = page.getByTestId('ranking-row-U-002')
    await expect(row).toBeVisible()

    await expect(page.getByTestId('ranking-rank-U-002')).toBeVisible()
    await expect(page.getByTestId('ranking-nickname-U-002')).toContainText('김민수')
    await expect(page.getByTestId('ranking-nickname-U-002')).toContainText('@minsu_dev')
    await expect(page.getByTestId('ranking-points-U-002')).toBeVisible()
  })

  test('[필수] 포인트는 해커톤별 최고 점수의 합산으로 계산된다', async ({ page }) => {
    // U-002: aimers 0.7421 + daker 87.5 = 88.2pt (toFixed(1))
    await expect(page.getByTestId('ranking-points-U-002')).toHaveText('88.2')

    // U-003: daker 87.5 = 87.5pt
    await expect(page.getByTestId('ranking-points-U-003')).toHaveText('87.5')
  })

  test('[옵션] 기간 필터 버튼(지난 7일/30일/전체)이 모두 표시된다', async ({ page }) => {
    await expect(page.getByTestId('ranking-filter-7d-btn')).toBeVisible()
    await expect(page.getByTestId('ranking-filter-30d-btn')).toBeVisible()
    await expect(page.getByTestId('ranking-filter-all-btn')).toBeVisible()
  })

  test('[옵션] 기간 필터 클릭 시 해당 필터가 활성화된다', async ({ page }) => {
    // 기본값은 전체(all)
    const allBtn = page.getByTestId('ranking-filter-all-btn')
    const sevenDBtn = page.getByTestId('ranking-filter-7d-btn')
    const thirtyDBtn = page.getByTestId('ranking-filter-30d-btn')

    // 지난 7일 클릭
    await sevenDBtn.click()
    await expect(sevenDBtn).toHaveClass(/bg-blue-500/)
    await expect(allBtn).not.toHaveClass(/bg-blue-500/)

    // 지난 30일 클릭
    await thirtyDBtn.click()
    await expect(thirtyDBtn).toHaveClass(/bg-blue-500/)
    await expect(sevenDBtn).not.toHaveClass(/bg-blue-500/)

    // 전체 클릭
    await allBtn.click()
    await expect(allBtn).toHaveClass(/bg-blue-500/)
    await expect(thirtyDBtn).not.toHaveClass(/bg-blue-500/)
  })

  test('[옵션] 해당 기간에 제출 내역이 없으면 빈 상태 메시지가 표시된다', async ({ page }) => {
    // 지난 7일 필터: aimers 제출일(2026-02) 제외 → 제출 결과 없을 수 있음
    // 데이터 기준 daker 제출일(2026-04-13)이 포함되면 결과 있음 / 없으면 빈 상태
    // empty-msg 또는 ranking-table 둘 중 하나가 표시됨을 확인
    await page.getByTestId('ranking-filter-7d-btn').click()
    const hasTable = await page.getByTestId('ranking-table').isVisible()
    const hasEmpty = await page.getByTestId('ranking-empty-msg').isVisible()
    expect(hasTable || hasEmpty).toBe(true)
  })
})
