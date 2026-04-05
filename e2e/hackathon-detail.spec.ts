import { test, expect, type Page } from '@playwright/test'

// aimers-8-model-lite: prize 있음, 점수 < 1 (toFixed(4)), U-002에게 T-ALPHA 초대 pending
// daker-handover-2026-03: submission items 3개 (plan/web/pdf), 점수 >= 1 (toFixed(1))

const SLUG = 'aimers-8-model-lite'
const SLUG_WITH_ITEMS = 'daker-handover-2026-03'

function loginAsU002(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'member',
      JSON.stringify({
        state: { member: { userId: 'U-002', nickname: '김민수' } },
        version: 0,
      }),
    )
  })
}

test.describe('해커톤 상세 페이지 - 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/hackathons/${SLUG}`)
  })

  test('[필수] nav에 개요/평가/일정/상금/팀/제출/리더보드가 모두 표시된다', async ({ page }) => {
    await expect(page.getByTestId('hackathon-nav-overview-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-eval-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-schedule-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-prize-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-teams-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-submit-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-leaderboard-btn')).toBeVisible()
  })

  test('[필수] nav 각 항목 클릭 시 해당 섹션에 접근할 수 있다', async ({ page }) => {
    await page.getByTestId('hackathon-nav-overview-btn').click()
    await expect(page.getByTestId('hackathon-section-overview')).toBeVisible()

    await page.getByTestId('hackathon-nav-eval-btn').click()
    await expect(page.getByTestId('hackathon-section-eval')).toBeVisible()

    await page.getByTestId('hackathon-nav-schedule-btn').click()
    await expect(page.getByTestId('hackathon-section-schedule')).toBeVisible()

    await page.getByTestId('hackathon-nav-prize-btn').click()
    await expect(page.getByTestId('hackathon-section-prize')).toBeVisible()

    await page.getByTestId('hackathon-nav-teams-btn').click()
    await expect(page.getByTestId('hackathon-section-teams')).toBeVisible()

    await page.getByTestId('hackathon-nav-submit-btn').click()
    await expect(page.getByTestId('hackathon-section-submit')).toBeVisible()

    await page.getByTestId('hackathon-nav-leaderboard-btn').click()
    await expect(page.getByTestId('hackathon-leaderboard-table')).toBeVisible()
  })
})

test.describe('해커톤 상세 페이지 - 팀 섹션', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsU002(page)
    await page.goto(`/hackathons/${SLUG}`)
    await page.getByTestId('hackathon-nav-teams-btn').click()
  })

  test('[필수] 팀 섹션에서 초대 수락/거절 버튼이 표시된다', async ({ page }) => {
    // U-002는 T-ALPHA로부터 pending 초대를 받은 상태 (my.json 기준)
    await expect(page.getByTestId('hackathon-section-teams')).toBeVisible()
    await expect(page.getByTestId('hackathon-teams-invite-accept-btn')).toBeVisible()
    await expect(page.getByTestId('hackathon-teams-invite-reject-btn')).toBeVisible()
  })

  test('[옵션] 합류 신청 클릭 시 유의사항 팝업이 표시된다', async ({ page }) => {
    // T-DELTA: aimers-8-model-lite의 open 팀, U-002와 초대 관계 없음
    await expect(page.getByTestId('hackathon-teams-join-btn-T-DELTA')).toBeVisible()
    await page.getByTestId('hackathon-teams-join-btn-T-DELTA').click()
    await expect(page.getByTestId('hackathon-teams-join-caution-dialog')).toBeVisible()
  })
})

test.describe('해커톤 상세 페이지 - 제출 섹션', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/hackathons/${SLUG}`)
    await page.getByTestId('hackathon-nav-submit-btn').click()
  })

  test('[필수] 제출 가이드가 표시된다', async ({ page }) => {
    await expect(page.getByTestId('hackathon-section-submit')).toBeVisible()
    await expect(page.getByTestId('hackathon-submit-guide')).toBeVisible()
  })

  test('[필수] 제출 폼 항목이 표시된다', async ({ page }) => {
    // aimers-8-model-lite는 submissionItems가 없으므로 기본 'default' 항목 표시
    await expect(page.getByTestId('hackathon-submit-item-default')).toBeVisible()
  })
})

test.describe('해커톤 상세 페이지 - 리더보드', () => {
  test('[필수] 해커톤 설정에 따라 점수 형식이 다르게 표시된다', async ({ page }) => {
    // aimers-8-model-lite: 점수 < 1 → toFixed(4)
    await page.goto(`/hackathons/${SLUG}`)
    await page.getByTestId('hackathon-nav-leaderboard-btn').click()
    await expect(page.getByTestId('hackathon-leaderboard-table')).toBeVisible()
    const alphaScore = page.getByTestId('hackathon-leaderboard-score-team-alpha')
    await expect(alphaScore).toBeVisible()
    await expect(alphaScore).toHaveText('0.7421')

    // daker-handover-2026-03: 점수 >= 1 → toFixed(1)
    await page.goto(`/hackathons/${SLUG_WITH_ITEMS}`)
    await page.getByTestId('hackathon-nav-leaderboard-btn').click()
    await expect(page.getByTestId('hackathon-leaderboard-table')).toBeVisible()
    const foundScore = page.getByTestId('hackathon-leaderboard-score-404found')
    await expect(foundScore).toBeVisible()
    await expect(foundScore).toHaveText('87.5')
  })

  test('[필수] 참가했으나 제출 내역이 없는 팀은 미제출로 표기되고 순위를 표시하지 않는다', async ({ page }) => {
    await page.goto(`/hackathons/${SLUG}`)
    await page.getByTestId('hackathon-nav-leaderboard-btn').click()
    await expect(page.getByTestId('hackathon-leaderboard-table')).toBeVisible()

    // Team Delta: status=no-submission
    const deltaRow = page.getByTestId('hackathon-leaderboard-row-team-delta')
    await expect(deltaRow).toBeVisible()

    // 점수 셀에 '미제출' 표기
    await expect(page.getByTestId('hackathon-leaderboard-no-submission-team-delta')).toHaveText('미제출')

    // 순위 셀에 '-' (숫자 순위 없음)
    const rankCell = deltaRow.locator('td').first()
    await expect(rankCell).toHaveText('-')
  })
})

test.describe('해커톤 상세 페이지 - 제출 차단', () => {
  test('[필수] 종료된 해커톤의 제출 페이지에서 제출 폼이 차단된다', async ({ page }) => {
    // aimers-8-model-lite: status = "ended"
    await page.goto(`/hackathons/${SLUG}/submit/default`)
    await expect(page.getByTestId('submit-status-blocked-msg')).toBeVisible()
    await expect(page.getByTestId('submit-status-blocked-msg')).toContainText('종료된 해커톤')
  })

  test('[필수] 시작 전 해커톤의 제출 페이지에서 제출 폼이 차단된다', async ({ page }) => {
    // daker-handover-2026-03: status = "upcoming"
    await page.goto(`/hackathons/${SLUG_WITH_ITEMS}/submit/plan`)
    await expect(page.getByTestId('submit-status-blocked-msg')).toBeVisible()
    await expect(page.getByTestId('submit-status-blocked-msg')).toContainText('아직 시작되지 않은')
  })

  test('[필수] 진행 중인 해커톤의 제출 페이지에서 제출 폼이 노출된다', async ({ page }) => {
    // monthly-vibe-coding-2026-02: status = "ongoing"
    await page.goto('/hackathons/monthly-vibe-coding-2026-02/submit/idea')
    await expect(page.getByTestId('submit-status-blocked-msg')).not.toBeVisible()
  })
})

test.describe('해커톤 상세 페이지 - nav 제출 드롭다운', () => {
  test.beforeEach(async ({ page }) => {
    // daker-handover-2026-03는 plan/web/pdf 3개의 submission items를 가짐
    await page.goto(`/hackathons/${SLUG_WITH_ITEMS}`)
  })

  test('[자체] nav 제출 항목에 hover 시 submission items가 표시된다', async ({ page }) => {
    await page.getByTestId('hackathon-nav-submit-btn').hover()
    await expect(page.getByTestId('hackathon-nav-submit-dropdown')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-submit-item-plan')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-submit-item-web')).toBeVisible()
    await expect(page.getByTestId('hackathon-nav-submit-item-pdf')).toBeVisible()
  })

  test('[자체] submission item 클릭 시 해당 제출 페이지로 이동한다', async ({ page }) => {
    await page.getByTestId('hackathon-nav-submit-btn').hover()
    await page.getByTestId('hackathon-nav-submit-item-plan').click()
    await expect(page).toHaveURL(`/hackathons/${SLUG_WITH_ITEMS}/submit/plan`)
  })
})
