import { defineStore } from 'pinia'

export const useSelectedArtistsStore = defineStore('selectedArtists', {
  state: () => ({
    selectedArtists: [] as any,
  }),
  persist: {
    storage: sessionStorage,
  }
})