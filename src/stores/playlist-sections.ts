import { defineStore } from 'pinia'

export const usePlaylistSectionsStore = defineStore('playlistSections', {
  state: () => ({
    playlistSections: [] as any,
    playlistSongs: [] as any,
    sectionId: 0
  }),
  getters: {
  },
  actions: {
    saveArtistSections(artists: any): void {
      //sections can be artists, albums, tracks...?
      artists.forEach((artist: any) => {
        const sectionId = this.sectionId++
        artist.sectionId = sectionId
        let hasSongs = false
        artist.loadedSongs.slice(0, artist.numberOfSongs).forEach((song: any) => {
          //return if song is already in playlist
          if (this.playlistSongs.find((playlistSong: any) => playlistSong.id === song.id)) {
            return
          }
          hasSongs = true
          this.playlistSongs.push(this.formattedSong(song, sectionId))
        })
        if (hasSongs) {
          this.playlistSections.push(this.formattedArtistSection(artist, sectionId))
        }
      })
    },

    addGenreSongs(songs: any, genreName: string) {
      let hasSongs = false
      const sectionId = this.sectionId++
      songs.forEach((song: any) => {
        if (this.playlistSongs.find((playlistSong: any) => playlistSong.id === song.id)) {
          return
        }
        hasSongs = true
        this.playlistSongs.push(this.formattedSong(song, sectionId))
      })
      if (hasSongs) {
        this.playlistSections.push({
          id: sectionId,
          name: genreName,
          selection: 'Genre'
        })
      }
    },

    addSingleTrack(song: any, sectionName: string): void {
      const sectionId = this.addSeparateSongsSection(sectionName, '')
      this.playlistSongs.push(this.formattedSong(song, sectionId))
    },

    formattedArtistSection(artist: any, sectionId: number): any {
      return {
        id: sectionId,
        name: artist.name,
        selection: artist.selection.description,
      }
    },

    addSeparateSongsSection(sectionName: string, selectionName: string): number {
      const section = this.playlistSections.find((section: any) => section.name === sectionName)
      if (!section) {
        const sectionId = this.sectionId++
        this.playlistSections.push({
          id: sectionId,
          name: sectionName,
          selection: selectionName
        })
        return sectionId
      }
      return section.id
    },

    formattedSong(song: any, sectionId: number): any {
      return {
        id: song.id,
        name: song.name,
        artist: song.artists[0].name,
        //album: song.album.name,
        //image: song.album.images[0].url,
        duration: song.duration_ms,
        uri: song.uri,
        sectionId: sectionId
      }
    },

    removeSection(playlistSectionId: number): void {
      const sectionIndex = this.playlistSections.findIndex((section: any) => section.id === playlistSectionId)
      if (sectionIndex !== -1) {
        this.playlistSections.splice(sectionIndex, 1)
      }
      this.playlistSongs = this.playlistSongs.filter((song: any) => song.sectionId !== playlistSectionId)
    },

    clearPlaylist() {
      this.playlistSections = []
      this.playlistSongs = []
      this.sectionId = 0
    }
  },
  persist: true
})