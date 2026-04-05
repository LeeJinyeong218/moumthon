import { create } from "zustand"
import { persist } from "zustand/middleware"

type Member = {
  userId?: string
  nickname: string
  avatarUrl?: string
  unreadCount?: number
}

type MemberStore = {
  member: Member | null
  setMember: (member: Member) => void
  updateMember: (patch: Partial<Member>) => void
  clearMember: () => void
}

export const useMemberStore = create<MemberStore>()(
  persist(
    (set) => ({
      member: null,

      setMember: (member) => set({ member }),

      updateMember: (patch) =>
        set((state) =>
          state.member ? { member: { ...state.member, ...patch } } : state,
        ),

      clearMember: () => set({ member: null }),
    }),
    { name: "member" },
  ),
)
