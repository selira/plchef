import { defineStore } from 'pinia'

export const useLocalStorageStore = defineStore('localStorage', {
  state: () => ({
    audioPlayerVolume: 0.5,
    sectionsVisible: true,
    mostLikelySourceOfAuth: 'trial',
    darkMode: true
  }),
  getters: {
  },
  actions: {
  },
  persist: true
})