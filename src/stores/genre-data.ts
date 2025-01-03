import { defineStore } from 'pinia'

export const useGenreDataStore = defineStore('genresData', {
  state: () => ({
    genresTree: null as any,
    genresList: null as any,
    sortOption: null as any,
    version: null as any
  }),
  getters: {
  },
  actions: {
  },
  persist: true
})