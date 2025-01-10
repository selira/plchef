import { defineStore } from 'pinia'

export const useStateStore = defineStore('state', {
  state: () => ({
    playlistName: 'PLChef Playlist (' + new Date().toDateString() + ')',
  }),
  getters: {
  },
  actions: {
  }
})