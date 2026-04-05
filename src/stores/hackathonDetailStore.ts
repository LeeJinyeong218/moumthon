import { create } from "zustand"

type State = {
  activeSection: string
  scrollTarget: string | null
  setActiveSection: (s: string) => void
  requestScroll: (s: string) => void
  clearScrollTarget: () => void
}

export const useHackathonDetailStore = create<State>((set) => ({
  activeSection: "overview",
  scrollTarget: null,
  setActiveSection: (activeSection) => set({ activeSection }),
  requestScroll: (scrollTarget) => set({ scrollTarget }),
  clearScrollTarget: () => set({ scrollTarget: null }),
}))
