# Data

프론트엔드 전용 해커톤 플랫폼의 데이터 설계 문서다.
백엔드 없이 정적 JSON + localStorage만으로 동작한다.
UI 구현 전에 이 문서 전체를 읽는다.

---

## 파일 목록

모든 파일은 `src/assets/data/`에 위치한다.

```
src/assets/data/
├── public_hackathons.json        해커톤 목록 (카드 UI용)
├── public_hackathon_detail.json  해커톤 상세 (탭별 섹션 구조)
├── public_leaderboard.json       리더보드 (순위/점수 source of truth)
├── public_teams.json             팀 모집 공개 목록
├── public_users.json             유저 프로필
├── public_team_members.json      팀별 멤버 구성
├── public_submissions.json       팀별 제출 내역
├── my.json                       현재 로그인 유저 세션
└── my_notifications.json         알림 목록
```

`public_` 접두사: 비로그인 상태에서도 읽을 수 있는 공개 데이터. 서버 컴포넌트에서 직접 import한다.  
`my` 접두사: 현재 로그인 유저에 종속된 데이터. localStorage에 저장하고 `createLocalStoreHook`으로 읽는다.

---

## 데이터 접근 방법

### public 파일 — 서버 컴포넌트에서 직접 import

API가 없으므로 `useEffect`나 `fetch` 없이 정적으로 import한다.

```ts
import hackathons from "@/assets/data/public_hackathons.json"
import hackathonDetail from "@/assets/data/public_hackathon_detail.json"
```

### my 파일 — localStorage store

`createLocalStore` from `@/lib/storage` — 특정 key에 대한 CRUD API를 반환.
모든 메서드는 `{ data, error: null }` 또는 `{ data: null, error: string }` Result 타입을 반환.

```ts
import { createLocalStore } from "@/lib/storage"
import type { Team } from "@/types"

const teamStore = createLocalStore<Team>("teams", "teamCode")

const { data, error } = teamStore.getAll()
const { data, error } = teamStore.getById("T-ALPHA")
const { data, error } = teamStore.create({ teamCode: "T-NEW", ... })
const { data, error } = teamStore.update("T-ALPHA", { isOpen: false })
const { data, error } = teamStore.remove("T-ALPHA")

// 데이터 없을 때만 실행됨
teamStore.seed(mockTeams)
```

API가 생기면 이 store를 fetch 호출로 교체한다.

### React hook — 컴포넌트에서 데이터 읽기/쓰기

`createLocalStoreHook` from `@/hooks/useLocalStore` — store를 React state와 연결.
`items` 상태가 localStorage와 동기화되며, CRUD 호출 시 즉시 리렌더된다.

hook 정의 (리소스당 한 번):

```ts
import { createLocalStoreHook } from "@/hooks/useLocalStore"
import type { Team } from "@/types"
import mockTeams from "@/assets/data/public_teams.json"

export const useTeamStore = createLocalStoreHook<Team>("teams", "teamCode", {
  initialData: mockTeams as Team[],  // localStorage가 비어있을 때 seed
})
```

컴포넌트에서 사용:

```ts
const { items, create, update, remove, get } = useTeamStore()

items                                          // React state, localStorage 변경 시 자동 반영
const { data, error } = get("T-ALPHA")        // 단건 조회
const { data, error } = create({ teamCode: "T-NEW", ... })
const { data, error } = update("T-ALPHA", { isOpen: false })
const { data, error } = remove("T-ALPHA")
```

---

## 파일별 구조

### public_hackathons.json `Array<Hackathon>`

해커톤 목록 페이지와 카드 컴포넌트에서 사용한다.

```ts
type Hackathon = {
  slug: string               // 전체 데이터에서 해커톤을 식별하는 고유 키
  title: string
  status: "upcoming" | "ongoing" | "ended"
  tags: string[]
  thumbnailUrl: string
  period: {
    timezone: string
    submissionDeadlineAt: string  // ISO 8601
    endAt: string
  }
  links: {
    detail: string          // 상세 페이지 경로
    rules: string
    faq: string
  }
}
```

### public_hackathon_detail.json `HackathonDetail`

해커톤 상세 페이지에서 탭별로 렌더링한다.
최상위 객체는 `slug: "aimers-8-model-lite"` 해커톤이며,
`extraDetails` 배열에 나머지 해커톤의 상세 데이터가 포함된다.

```ts
type HackathonDetail = {
  slug: string
  title: string
  sections: {
    overview: {
      summary: string
      teamPolicy: { allowSolo: boolean; maxTeamSize: number }
    }
    info: {
      notice: string[]
      links: { rules: string; faq: string }
    }
    eval: {
      metricName: string
      description: string
      scoreSource?: "leaderboard" | "vote"  // 없으면 leaderboard 기반
      scoreDisplay?: {                        // 투표 기반일 때만 존재
        label: string
        breakdown: { key: string; label: string; weightPercent: number }[]
      }
      limits?: { maxRuntimeSec: number; maxSubmissionsPerDay: number }
    }
    schedule: {
      timezone: string
      milestones: { name: string; at: string }[]
    }
    prize?: {
      items: { place: string; amountKRW: number }[]
    }
    teams: { campEnabled: boolean; listUrl: string }
    submit: {
      allowedArtifactTypes: ("zip" | "url" | "text" | "pdf")[]
      submissionUrl: string
      guide: string[]
      submissionItems?: {         // 단계별 제출이 있는 해커톤에만 존재
        key: string
        title: string
        format: string
      }[]
    }
    leaderboard: { publicLeaderboardUrl: string; note: string }
  }
  extraDetails?: HackathonDetail[]  // 같은 구조가 재귀적으로 포함됨
}
```

**DO** slug로 해커톤을 찾을 때 `extraDetails`까지 재귀 탐색한다.  
**DO NOT** 최상위 객체의 slug만 확인하고 `extraDetails`를 누락한다.

### public_leaderboard.json `Leaderboard`

순위와 점수의 **source of truth**다. 프론트엔드는 이 파일을 그대로 렌더링한다.

```ts
type LeaderboardEntry = {
  rank: number
  teamName: string
  score: number
  submittedAt: string
  scoreBreakdown?: Record<string, number>  // 투표 기반 해커톤에만 존재
  artifacts?: {                             // 아이디어 해커톤에만 존재
    webUrl?: string
    pdfUrl?: string
    planTitle?: string
  }
}

type Leaderboard = {
  hackathonSlug: string
  updatedAt: string
  entries: LeaderboardEntry[]
  extraLeaderboards: {      // 다른 해커톤의 리더보드가 여기에 포함
    hackathonSlug: string
    updatedAt: string
    entries: LeaderboardEntry[]
  }[]
}
```

**DO** 특정 해커톤의 리더보드를 찾을 때 `extraLeaderboards`도 탐색한다.  
**DO NOT** `submissions.json`의 점수로 순위를 재계산한다.

### public_teams.json `Array<Team>`

팀 캠프(모집 게시판) 페이지에서 사용한다. 팀원 구성 상세는 포함하지 않는다.

```ts
type Team = {
  teamCode: string        // team_members와 조인 키
  hackathonSlug: string
  name: string
  isOpen: boolean         // false면 모집 마감
  memberCount: number
  lookingFor: string[]
  intro: string
  contact: { type: "link"; url: string }
  createdAt: string
}
```

### public_users.json `Array<User>`

유저 프로필 페이지와 팀원 상세에서 사용한다.

```ts
type User = {
  userId: string          // "U-001" 형태, team_members와 조인 키
  username: string
  displayName: string
  avatarUrl: string
  role: "user" | "admin"
  bio: string
  skills: string[]
  links: { github?: string; blog?: string; portfolio?: string }
  stats: {
    hackathonsJoined: number
    hackathonsWon: number
    submissionsTotal: number
  }
  createdAt: string
}
```

### public_team_members.json `Array<TeamMembers>`

팀 상세에서 멤버 목록을 렌더링할 때 사용한다.
`users`와 `userId`로 조인하면 프로필 전체를 가져올 수 있다.

```ts
type TeamMember = {
  userId: string          // users.userId와 대응
  displayName: string     // 조인 없이 표시할 수 있도록 비정규화
  avatarUrl: string
  role: "leader" | "member"
  joinedAt: string
}

type TeamMembers = {
  teamCode: string        // teams.teamCode와 대응
  hackathonSlug: string
  members: TeamMember[]
}
```

목록 렌더링 시 `displayName`, `avatarUrl`은 조인 없이 사용한다.  
상세 프로필이 필요할 때만 `users`에서 `userId`로 조회한다.

### public_submissions.json `Array<TeamSubmissions>`

내 제출 내역 페이지에서 사용한다. 순위 계산에는 사용하지 않는다.

```ts
type Submission = {
  submissionId: string
  submittedAt: string
  artifactType: "zip" | "url" | "text" | "pdf"
  artifactUrl?: string      // zip, url, pdf일 때
  artifactContent?: string  // text일 때
  score?: number            // 채점 완료된 경우에만 존재
  status: "received" | "scored"
  note?: string
  isBest?: true             // 리더보드에 반영된 제출. 팀당 최대 1개
}

type TeamSubmissions = {
  hackathonSlug: string
  teamCode: string
  teamName: string
  submissions: Submission[]
}
```

**DO** 내 제출 내역을 보여줄 때 `my.json`의 `myTeams`로 teamCode를 특정한 뒤 이 파일에서 조회한다.  
**DO NOT** `isBest` 항목의 점수로 리더보드 순위를 재계산한다.

### my.json `MySession` — localStorage key: `"my"`

현재 로그인 유저의 세션 데이터다. 더미 기준 로그인 유저는 `U-002 김민수`다.

```ts
type MySession = {
  userId: string
  username: string
  displayName: string
  avatarUrl: string
  role: "user" | "admin"
  bookmarkedHackathons: string[]  // slug 배열
  myTeams: {
    hackathonSlug: string
    teamCode: string
    teamName: string
    role: "leader" | "member"
  }[]
  mySubmissions: {
    hackathonSlug: string
    teamCode: string
    latestSubmissionId: string
    latestScore: number
    currentRank: number
  }[]
  notifications: {
    unreadCount: number
    listUrl: string
  }
}
```

### my_notifications.json `Array<Notification>` — localStorage key: `"notifications"`

알림 목록 페이지에서 사용한다.

```ts
type Notification = {
  notificationId: string
  userId: string
  type:
    | "hackathon_new"
    | "hackathon_upcoming"
    | "leaderboard_updated"
    | "submission_scored"
    | "team_member_joined"
  isRead: boolean
  createdAt: string
  title: string
  body: string
  linkUrl: string
  relatedEntity: {
    type: "hackathon" | "team" | "submission"
    slug?: string           // type === "hackathon"
    teamCode?: string       // type === "team"
    submissionId?: string   // type === "submission"
  }
}
```

---

## 파일 간 관계 (조인 키)

```
hackathons.slug
  ├── hackathon_detail  (slug / extraDetails[].slug)
  ├── leaderboard       (hackathonSlug / extraLeaderboards[].hackathonSlug)
  ├── teams             (hackathonSlug)
  ├── team_members      (hackathonSlug)
  └── submissions       (hackathonSlug)

teams.teamCode
  ├── team_members      (teamCode)
  ├── submissions       (teamCode)
  └── my.myTeams        (teamCode)

users.userId
  ├── team_members.members  (userId)
  ├── my                    (userId)
  └── notifications         (userId)
```

---

## 데이터 흐름 — 페이지별

| 페이지 | 읽는 파일 |
|---|---|
| `/hackathons` | `public_hackathons.json`, `my.json` |
| `/hackathons/[slug]` | `public_hackathon_detail.json`, `public_leaderboard.json`, `my.json` |
| `/camp` | `public_teams.json`, `public_team_members.json`, `public_users.json` |
| `/my` | `my.json`, `public_submissions.json`, `public_hackathons.json` |
| `/my/notifications` | `my_notifications.json`, `my.json` |

### `/hackathons` 해커톤 목록

- `hackathons` 전체를 렌더링한다.
- `status` 값으로 탭(진행중 / 예정 / 종료)을 구분한다.
- `my.bookmarkedHackathons`에 slug가 있으면 북마크 표시를 활성화한다.

### `/hackathons/[slug]` 해커톤 상세

- `hackathon_detail`에서 slug를 탐색한다. `extraDetails`까지 재귀 탐색해야 한다.
- 탭 구성: 개요 / 정보 / 일정 / 시상 / 제출 / 리더보드
- 리더보드 탭: `leaderboard`에서 해당 slug를 찾는다. `extraLeaderboards`까지 탐색한다.
- `my.myTeams`에 해당 slug가 있으면 "내 팀" 배지와 제출 버튼을 활성화한다.

### `/camp` 팀 캠프

- `teams`를 렌더링한다. `hackathonSlug` 쿼리 파라미터로 필터링한다.
- 팀 카드 클릭 시 `team_members`에서 teamCode로 멤버를 조회한다.
- 멤버 아바타 클릭 시 `users`에서 userId로 프로필을 조회한다.

### `/my` 마이페이지

- `my.myTeams`로 참가 중인 해커톤 목록을 렌더링한다.
- 각 해커톤의 제출 내역은 `submissions`에서 teamCode로 조회한다.
- 북마크 목록은 `my.bookmarkedHackathons`의 slug로 `hackathons`에서 조회한다.

### `/my/notifications` 알림

- `notifications`를 `createdAt` 내림차순으로 렌더링한다.
- 읽음 처리 시 `isRead`를 `true`로 갱신하고 `my.notifications.unreadCount`를 감소시킨다.
- 두 변경 모두 localStorage에 반영한다.

---

## 규칙

**점수/순위**  
순위와 점수는 `public_leaderboard.json`만 읽는다.  
`submissions`의 점수는 "내 제출 히스토리" 표시 전용이다. 순위 계산에 쓰지 않는다.

**중첩 구조 탐색**  
`hackathon_detail`과 `leaderboard`는 중첩 배열(`extraDetails`, `extraLeaderboards`)을 갖는다.  
slug로 데이터를 찾을 때 반드시 중첩 배열까지 탐색한다.

**localStorage 키**  
`my.json` → `"my"`, `my_notifications.json` → `"notifications"`.  
나머지 `public_` 파일은 정적으로 import하고 localStorage에 저장하지 않는다.

**비정규화 필드**  
`team_members.members`의 `displayName`, `avatarUrl`은 `users`와 중복된다.  
목록 렌더링 시 조인 없이 이 필드를 사용한다. 상세 프로필이 필요할 때만 `users`를 조회한다.

**API 전환**  
`createLocalStore` / `createLocalStoreHook`을 fetch 호출로 교체하면 API 연동이 완료된다.  
컴포넌트 코드는 변경하지 않는다.
