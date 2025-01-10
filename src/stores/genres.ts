import { defineStore } from 'pinia'

export const useGenresStore = defineStore('genres', {
  state: () => ({
    expandedGenres: null as any,
    selectedGenre: null as any,
    selectedGenres: [] as any
  }),
  getters: {
  },
  actions: {
  }
})