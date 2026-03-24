import { create } from 'zustand'

interface RoomStore {
  roomCode: string | null
  partnerName: string | null
  partnerStep: number
  partnerReady: boolean
  setRoom: (code: string | null) => void
  updatePartner: (data: { name: string; step: number }) => void
  setPartnerReady: (ready: boolean) => void
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomCode: null,
  partnerName: null,
  partnerStep: 0,
  partnerReady: false,
  setRoom: (code) => set({ roomCode: code, partnerStep: 0, partnerReady: false, partnerName: null }),
  updatePartner: ({ name, step }) => set({ partnerName: name, partnerStep: step }),
  setPartnerReady: (ready) => set({ partnerReady: ready })
}))
