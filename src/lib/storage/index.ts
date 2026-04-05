/**
 * createLocalStore
 *
 * 특정 localStorage key에 대한 CRUD API를 반환합니다.
 * 백엔드 API처럼 사용할 수 있도록 Result 타입으로 래핑합니다.
 *
 * 사용 예시:
 *   const teamStore = createLocalStore<Team>("teams", "teamCode")
 *   teamStore.getAll()           // { data: Team[], error: null }
 *   teamStore.getById("T-ALPHA") // { data: Team, error: null } | { data: null, error: string }
 *   teamStore.create({...})
 *   teamStore.update("T-ALPHA", { isOpen: false })
 *   teamStore.remove("T-ALPHA")
 */

type Ok<T> = { data: T; error: null }
type Err = { data: null; error: string }
type Result<T> = Ok<T> | Err

function ok<T>(data: T): Ok<T> {
  return { data, error: null }
}

function err(message: string): Err {
  return { data: null, error: message }
}

// ───────────────────────────────────────────────────────────
// Raw localStorage helpers
// ───────────────────────────────────────────────────────────

function readRaw<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeRaw<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

// ───────────────────────────────────────────────────────────
// Factory
// ───────────────────────────────────────────────────────────

export function createLocalStore<T extends Record<string, unknown>>(
  key: string,
  idField: keyof T,
) {
  function getId(item: T): string {
    return String(item[idField])
  }

  return {
    /** 전체 목록 조회 */
    getAll(): Result<T[]> {
      return ok(readRaw<T>(key))
    },

    /** 단건 조회 */
    getById(id: string): Result<T> {
      const items = readRaw<T>(key)
      const found = items.find((item) => getId(item) === id)
      return found ? ok(found) : err(`${key}/${id} not found`)
    },

    /** 생성 — id 중복 시 에러 */
    create(item: T): Result<T> {
      const items = readRaw<T>(key)
      if (items.some((existing) => getId(existing) === getId(item))) {
        return err(`${key}/${getId(item)} already exists`)
      }
      writeRaw(key, [...items, item])
      return ok(item)
    },

    /** 수정 — 존재하지 않으면 에러 */
    update(id: string, patch: Partial<T>): Result<T> {
      const items = readRaw<T>(key)
      const index = items.findIndex((item) => getId(item) === id)
      if (index === -1) return err(`${key}/${id} not found`)
      const updated = { ...items[index], ...patch }
      items[index] = updated
      writeRaw(key, items)
      return ok(updated)
    },

    /** 삭제 */
    remove(id: string): Result<null> {
      const items = readRaw<T>(key)
      const next = items.filter((item) => getId(item) !== id)
      if (next.length === items.length) return err(`${key}/${id} not found`)
      writeRaw(key, next)
      return ok(null)
    },

    /** 전체 목록을 한 번에 교체 — 개별 update 루프 대신 사용 */
    setAll(items: T[]): void {
      writeRaw(key, items)
    },

    /** 초기 데이터 seeding — 이미 데이터가 있으면 skip */
    seed(initial: T[]): void {
      if (readRaw<T>(key).length === 0) {
        writeRaw(key, initial)
      }
    },

    /** localStorage에서 완전 삭제 */
    clear(): void {
      localStorage.removeItem(key)
    },
  }
}
