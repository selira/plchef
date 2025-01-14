import { defineStore } from 'pinia'

export const useStateStore = defineStore('state', {
  state: () => ({
    playlistName: 'PLChef Playlist (' + new Date().toDateString() + ')',
    lastArtistQuery: { 
      artistQuery: {
        title: 'My Top Artists (Short Term - 4 weeks)',
        value: 'top-short'
      }, 
      selectedGenre: {
        spotifyId: '',
        name: ''
      },
      pageNumber: 1,
      followedArtistCursors: {} as any,
    } as any,
    defaultArtistSelection: {
      defaultArtistSelection: {title: 'Top 10 songs', value: 'top-10', description: 'Top 10 songs'},
      defaultNumberOfSongs: 5,
      shuffleTopTen: false,
      defaultNumberOfAlbums: 1,
      randomSelectionNumberOfSongs: 20,
      prioritizePopularAlbums: false
    }
  }),
  getters: {
  },
  actions: {
  }
})