import { test, expect, type Page } from '@playwright/test'

// 세션 데이터 기준:
// 로그인 유저: U-002 김민수 (minsu_dev)
// 내 팀: T-BETA (monthly-vibe-coding), T-HANDOVER-01 (daker-handover)
// 전체 팀(내 팀 제외): T-ALPHA, T-DELTA (aimers, 모집 중), T-HANDOVER-02 (daker, 마감)

function loginAsU002(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem(
      'member',
      JSON.stringify({
        state: {
          member: {
            userId: 'U-002',
            username: 'minsu_dev',
            displayName: '김민수',
            avatarUrl: 'https://example.com/public/avatars/U-002.png',
            role: 'user',
          },
        },
        version: 0,
      })
    )
  })
}

test.describe('팀 찾기 (캠프) 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsU002(page)
    await page.goto('/camp')
  })

  test('[필수] 팀 목록이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('camp-team-list')).toBeVisible()
    // 내 팀이 아닌 팀들이 렌더링됨 (T-ALPHA, T-DELTA, T-HANDOVER-02)
    await expect(page.getByTestId('camp-team-card-T-ALPHA')).toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-DELTA')).toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-HANDOVER-02')).toBeVisible()
  })

  test('[필수] 내 팀 섹션이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('camp-my-team-section')).toBeVisible()
    await expect(page.getByTestId('camp-my-team-card-T-BETA')).toBeVisible()
    await expect(page.getByTestId('camp-my-team-card-T-HANDOVER-01')).toBeVisible()
  })

  test('[필수] 팀 만들기 버튼이 표시되고 /camp/new로 이동한다', async ({ page }) => {
    await expect(page.getByTestId('camp-create-team-btn')).toBeVisible()
    await page.getByTestId('camp-create-team-btn').click()
    await expect(page).toHaveURL(/\/camp\/new/)
  })

  test('[필수] 모집 여부 필터(전체/모집 중/마감) 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('camp-status-filter-all-btn')).toBeVisible()
    await expect(page.getByTestId('camp-status-filter-recruiting-btn')).toBeVisible()
    await expect(page.getByTestId('camp-status-filter-closed-btn')).toBeVisible()
  })

  test('[필수] 모집 중 필터 클릭 시 마감 팀이 사라진다', async ({ page }) => {
    await page.getByTestId('camp-status-filter-recruiting-btn').click()
    // T-HANDOVER-02는 isOpen=false(마감)이므로 사라져야 함
    await expect(page.getByTestId('camp-team-card-T-HANDOVER-02')).not.toBeVisible()
    // T-ALPHA, T-DELTA는 모집 중이므로 유지
    await expect(page.getByTestId('camp-team-card-T-ALPHA')).toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-DELTA')).toBeVisible()
  })

  test('[필수] 마감 필터 클릭 시 모집 중 팀이 사라진다', async ({ page }) => {
    await page.getByTestId('camp-status-filter-closed-btn').click()
    // T-HANDOVER-02만 남아야 함
    await expect(page.getByTestId('camp-team-card-T-HANDOVER-02')).toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-ALPHA')).not.toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-DELTA')).not.toBeVisible()
  })

  test('[필수] ?hackathon=slug URL 쿼리로 특정 해커톤 팀만 필터링된다', async ({ page }) => {
    await page.goto('/camp?hackathon=aimers-8-model-lite')
    // aimers 팀만 표시
    await expect(page.getByTestId('camp-team-card-T-ALPHA')).toBeVisible()
    await expect(page.getByTestId('camp-team-card-T-DELTA')).toBeVisible()
    // daker 팀은 표시되지 않음
    await expect(page.getByTestId('camp-team-card-T-HANDOVER-02')).not.toBeVisible()
  })

  test('[필수] 해당 조건의 팀이 없으면 빈 상태 메시지가 표시된다', async ({ page }) => {
    // 존재하지 않는 해커톤 slug로 필터
    await page.goto('/camp?hackathon=nonexistent-hackathon')
    await expect(page.getByTestId('camp-team-empty-msg')).toBeVisible()
  })
})

test.describe('팀 찾기 - 쪽지 보내기', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsU002(page)
    await page.goto('/camp')
  })

  test('[필수] 모집 중인 팀의 쪽지보내기 버튼이 활성화된다', async ({ page }) => {
    const btn = page.getByTestId('camp-team-message-btn-T-ALPHA')
    await expect(btn).toBeVisible()
    await expect(btn).toBeEnabled()
  })

  test('[필수] 마감된 팀의 쪽지보내기 버튼은 비활성화된다', async ({ page }) => {
    const btn = page.getByTestId('camp-team-message-btn-T-HANDOVER-02')
    await expect(btn).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('[필수] 쪽지보내기 버튼 클릭 시 모달이 열린다', async ({ page }) => {
    await page.getByTestId('camp-team-message-btn-T-ALPHA').click()
    await expect(page.getByTestId('camp-message-modal')).toBeVisible()
  })

  test('[필수] 메시지 입력 후 보내기 버튼이 활성화된다', async ({ page }) => {
    await page.getByTestId('camp-team-message-btn-T-ALPHA').click()
    const sendBtn = page.getByTestId('camp-message-send-btn')
    await expect(sendBtn).toBeDisabled()
    await page.getByTestId('camp-message-input').fill('안녕하세요, 팀에 합류하고 싶습니다!')
    await expect(sendBtn).toBeEnabled()
  })

  test('[옵션] 취소 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.getByTestId('camp-team-message-btn-T-ALPHA').click()
    await expect(page.getByTestId('camp-message-modal')).toBeVisible()
    await page.getByTestId('camp-message-cancel-btn').click()
    await expect(page.getByTestId('camp-message-modal')).not.toBeVisible()
  })
})

test.describe('내 팀 - 수정/삭제', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsU002(page)
    await page.goto('/camp')
  })

  test('[필수] 수정 버튼 클릭 시 수정 모달이 열린다', async ({ page }) => {
    await page.getByTestId('camp-my-team-edit-btn-T-BETA').click()
    await expect(page.getByTestId('camp-edit-modal')).toBeVisible()
  })

  test('[필수] 수정 모달에서 팀명 변경 후 저장이 가능하다', async ({ page }) => {
    await page.getByTestId('camp-my-team-edit-btn-T-BETA').click()
    await expect(page.getByTestId('camp-edit-modal')).toBeVisible()
    const nameInput = page.getByTestId('camp-edit-modal-name-input')
    await nameInput.clear()
    await nameInput.fill('새로운 팀 이름')
    await page.getByTestId('camp-edit-modal-save-btn').click()
    await expect(page.getByTestId('camp-edit-modal')).not.toBeVisible()
  })

  test('[필수] 삭제 버튼 클릭 시 삭제 확인 모달이 열린다', async ({ page }) => {
    await page.getByTestId('camp-my-team-delete-btn-T-BETA').click()
    await expect(page.getByTestId('camp-delete-modal')).toBeVisible()
  })

  test('[필수] 삭제 확인 버튼 클릭 시 모달이 닫힌다', async ({ page }) => {
    await page.getByTestId('camp-my-team-delete-btn-T-BETA').click()
    await expect(page.getByTestId('camp-delete-modal')).toBeVisible()
    await page.getByTestId('camp-delete-modal-confirm-btn').click()
    await expect(page.getByTestId('camp-delete-modal')).not.toBeVisible()
  })

  test('[옵션] 모집 상태 토글이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('camp-my-team-status-toggle-T-BETA')).toBeAttached()
    await expect(page.getByTestId('camp-my-team-status-toggle-T-HANDOVER-01')).toBeAttached()
  })
})

test.describe('팀 만들기 페이지 (/camp/new)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsU002(page)
    await page.goto('/camp/new')
  })

  test('[필수] 팀 유형 선택 버튼이 표시된다', async ({ page }) => {
    await expect(page.getByTestId('camp-new-team-hackathon-btn')).toBeVisible()
    await expect(page.getByTestId('camp-new-team-open-btn')).toBeVisible()
  })

  test('[필수] 해커톤팀 선택 시 해커톤 선택 드롭다운이 표시된다', async ({ page }) => {
    await page.getByTestId('camp-new-team-hackathon-btn').click()
    await expect(page.getByTestId('camp-new-team-hackathon-select')).toBeVisible()
  })

  test('[필수] 오픈팀 선택 시 해커톤 선택 드롭다운이 숨겨진다', async ({ page }) => {
    await page.getByTestId('camp-new-team-open-btn').click()
    await expect(page.getByTestId('camp-new-team-hackathon-select')).not.toBeVisible()
  })

  test('[필수] 팀명 미입력 시 팀 만들기 버튼이 비활성화된다', async ({ page }) => {
    await page.getByTestId('camp-new-team-open-btn').click()
    const submitBtn = page.getByTestId('camp-new-team-submit-btn')
    await expect(submitBtn).toBeDisabled()
  })

  test('[필수] 해커톤팀: 팀명 입력 + 해커톤 선택 시 팀 만들기 버튼이 활성화된다', async ({ page }) => {
    await page.getByTestId('camp-new-team-hackathon-btn').click()
    await page.getByTestId('camp-new-team-name-input').fill('테스트 팀')
    await page.getByTestId('camp-new-team-hackathon-select').selectOption('aimers-8-model-lite')
    await expect(page.getByTestId('camp-new-team-submit-btn')).toBeEnabled()
  })

  test('[필수] 오픈팀: 팀명 입력 시 팀 만들기 버튼이 활성화된다', async ({ page }) => {
    await page.getByTestId('camp-new-team-open-btn').click()
    await page.getByTestId('camp-new-team-name-input').fill('테스트 팀')
    await expect(page.getByTestId('camp-new-team-submit-btn')).toBeEnabled()
  })

  test('[필수] 최대 인원 증가/감소 버튼이 동작한다', async ({ page }) => {
    const count = page.getByTestId('camp-new-team-members-count')
    const initial = await count.textContent()
    await page.getByTestId('camp-new-team-members-increase-btn').click()
    const increased = await count.textContent()
    expect(Number(increased)).toBe(Number(initial) + 1)
    await page.getByTestId('camp-new-team-members-decrease-btn').click()
    const decreased = await count.textContent()
    expect(Number(decreased)).toBe(Number(initial))
  })

  test('[필수] 취소 버튼 클릭 시 이전 페이지로 이동한다', async ({ page }) => {
    // 이전 페이지가 /camp인 경우를 시뮬레이션
    await page.goto('/camp')
    await page.getByTestId('camp-create-team-btn').click()
    await expect(page).toHaveURL(/\/camp\/new/)
    await page.getByTestId('camp-new-team-cancel-btn').click()
    await expect(page).toHaveURL(/\/camp$/)
  })

  test('[옵션] 해커톤 상세 페이지에서 팀 만들기 시 해커톤이 사전 선택된다', async ({ page }) => {
    await page.goto('/camp/new?hackathon=aimers-8-model-lite')
    const select = page.getByTestId('camp-new-team-hackathon-select')
    await expect(select).toHaveValue('aimers-8-model-lite')
  })

  test('[옵션] 팀 만들기 완료 후 /camp로 이동한다', async ({ page }) => {
    await page.getByTestId('camp-new-team-open-btn').click()
    await page.getByTestId('camp-new-team-name-input').fill('테스트 팀')
    await page.getByTestId('camp-new-team-submit-btn').click()
    await expect(page).toHaveURL(/\/camp$/)
  })
})
