<template>
  <q-page class="column">
    <div class="row justify-between">
      <!-- <div class="col"> -->
        <div class="row justify-evenly q-ma-sm">
          <div v-if="!isMobile">
            <q-select
              filled
              multiple
              label="Select Genres"
              v-model="selectedGenres"
              :options="autocompleteGenreList"
              option-label="name"
              option-value="spotify_id"
              style="width: 350px;"
              class="q-pr-md"
              :dense="isMobile"
              max-values="5"
              @add="genreSelected"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    No results
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:selected-item="scope">
                <q-chip
                  removable
                  @remove="scope.removeAtIndex(scope.index)"
                  :tabindex="scope.tabindex"
                  class="q-ma-none"
                  style="width: max-content"
                  @click.stop
                >
                  <q-avatar>
                    <q-btn dense :icon="scope.opt.locked ? 'lock' : 'no_encryption'" @click.stop="scope.opt.locked = !scope.opt.locked"></q-btn>
                  </q-avatar>
                  {{ scope.opt.name }}
                </q-chip>
              </template>
            </q-select>
          </div>
          <div v-if="spotifyAuthStore.isPremium">
            <q-btn
              round
              :color="genrePlayColor(selectedGenres?.spotify_id)"
              :size="!isMobile? '11px' : '11px'"
              icon="arrow_right"
              :text-color="$q.dark.isActive ? 'black' : 'white'"
              @click.stop="playGenres(selectedGenres)"
              :disable="selectedGenres.length === 0"
              :class="[isMobile ? 'q-ml-sm q-mt-xs q-mb-xs' : 'q-ml-sm q-mt-sm']"
              :loading="loadingPlay"
            />
          </div>
          <div>
            <q-btn
              label="Random"
              @click="random()"
              :class="[isMobile ? 'q-ml-md q-mt-xs q-mb-xs' : 'q-ml-md q-mt-sm']"
              color="accent"
            />
          </div>
          <div>
            <q-btn
              label="Random 5"
              @click="random(true)"
              :class="[isMobile ? 'q-ml-md q-mt-xs q-mb-xs' : 'q-ml-md q-mt-sm']"
              color="accent"
            />
          </div>
        </div>
      <!-- </div> -->
        <div class="row justify-end q-pa-sm">
          <div>
            <q-select
              v-model="sortButton"
              :options="sortOptions"
              label="Sort by"
              :dense="isMobile"
              outlined
              emit-value
              map-options
              @update:model-value="sort"
              style="max-width: 200px;"
            />
          </div>
          <!-- <div class="self-center">
            <q-btn-toggle
              v-model="sortButton"
              push
              toggle-color="primary"
              :options="[
                {label: 'Sort by popularity', value: 'pop'},
                {label: 'Sort by alphabetical', value: 'alpha'},
                {label: 'Sort by affinity', value: 'affinity'}
              ]"
              @update:model-value="sort"
            />
          </div> -->
          <div class="q-ml-md">
            <q-input
              :dense="isMobile"
              filled
              :model-value="treeFilter"
              label="Search"
              @update:model-value="updateFilter"
              :style="{'width': isMobile ? '150px' : '300px'}"
            >

              <template v-slot:append>
                <q-icon v-if="treeFilter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
              </template>
            </q-input>
          </div>
        </div>
        <div class="q-pa-sm row">
          <q-badge color="secondary">
            Songs Per Genre: {{ songsPerGenre }}
          </q-badge>

          <q-slider
            :model-value="songsPerGenre"
            @change="songsPerGenreChanged"
            :min="1"
            :max="200"
            :step="1"
            color="primary"
            label
          />
        </div>
        <div class="q-pa-sm column">
          <div> Songs selected: {{ numberOfSongsSelected }} </div>
          <div> Songs in playlist: {{ numberSongsInPlaylist }} </div>
          <div :style="totalNumberOfSongsInPlaylist > maxNumberSongsInPlaylist ? 'color: red' : ''"> 
            Total songs: {{ totalNumberOfSongsInPlaylist }} / {{ maxNumberSongsInPlaylist }}
          </div>
        </div>
      </div>
      <div>
        <q-select
          filled
          multiple
          label="Select Genres"
          v-model="selectedGenres"
          :options="autocompleteGenreList"
          option-label="name"
          option-value="spotify_id"
          style="width: 350px;"
          class="q-px-sm q-mt-xs q-mb-sm"
          :dense="isMobile"
          max-values="5"
          @add="genreSelected"
          v-if="isMobile"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                No results
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:selected-item="scope">
            <q-chip
              removable
              @remove="scope.removeAtIndex(scope.index)"
              :tabindex="scope.tabindex"
              class="q-ma-none"
              style="width: max-content"
              @click.stop
            >
              <q-avatar>
                <q-btn dense :icon="scope.opt.locked ? 'lock' : 'no_encryption'" @click.stop="scope.opt.locked = !scope.opt.locked"></q-btn>
              </q-avatar>
              {{ scope.opt.name }}
            </q-chip>
          </template>
        </q-select>
      </div>
      <q-separator />

      <div style="min-height: 0px; flex: 1 1 auto; overflow-y: auto;">
      <!-- <q-card-section class="scroll col-9" style="max-height: 65vh; min-height: 60vh;">  -->
          <div :class="{'q-pa-md': !isMobile, 'q-gutter-sm': !isMobile}">
            <div v-for="tree in loadedGenresTree"  :key="tree.index">
            <q-tree
              :nodes="[tree]"
              node-key="index"
              label-key="name"
              children-key="subgenres"
              no-transition
              :filter="treeFilter"
              v-model:expanded="expandedGenres[tree.name]"
              no-results-label=' '
            >
              <template v-slot:default-header="prop">
                <div class="textColor">
                  <q-btn 
                    @click.stop="addGenre(prop.node)" 
                    flat 
                    round 
                    class="q-ma-none q-pa-none" 
                    :size="!isMobile? '11px' : '14px'" 
                    dense 
                    outline
                    :disable="prop.node.spotify_id === null || (selectedGenres.length >= 5 && !selectedGenres.some((genre2: any) => genre2.spotify_id === prop.node.spotify_id))"
                  >
                    <q-icon
                      :name="selectedGenres.some((genre2: any) => genre2.spotify_id === prop.node.spotify_id) ? 'check' : 'add'"
                      size="sm"
                      class="q-ma-none q-pa-none"
                    />
                  </q-btn>
                  <!-- <q-icon 
                    name="add" 
                    @click.stop="addGenre(prop.node)" 
                  /> -->
                  <q-btn
                    v-if="spotifyAuthStore.isPremium"
                    dense
                    round
                    :color="genrePlayColor(prop.node.spotify_id)"
                    :size="!isMobile? '11px' : '14px'"
                    icon="arrow_right"
                    :text-color="$q.dark.isActive ? 'black' : 'white'"
                    @click.stop="playGenre(prop.node.spotify_id)"
                    :disable="prop.node.spotify_id === null"
                    class="q-ml-sm"
                  >
                    <!-- <q-tooltip v-if="!isMobile">
                      {{ prop.node.spotify_id === null ? 'No Preview Available' : 'Play Random Preview Clip' }}
                    </q-tooltip> -->
                  </q-btn>
                  <span class="q-ml-sm textColor">{{ prop.node.name + ' ' + subgenresLabel(prop.node) }}</span>
                </div>
              </template>
            </q-tree>
            </div>
          </div>
      </div>
      <q-separator />
      <br>
      <br>
      <br>
      <br>
      <div class="row justify-center fixed-bottom-left">
        <q-btn
          v-if="isMobile"
          @click="addSelectionToPlaylist()"
          color="primary"
          size="18px"
          :disable="disabledAddSelectionButton()"
          :loading="addSelectionLoading"
          :icon="selectedGenres.length === 0 ? 'arrow_back' : 'add'"
        ></q-btn>
        <q-btn
          v-else
          @click="addSelectionToPlaylist()"
          color="primary"
          size="18px" 
          :disable="disabledAddSelectionButton()"
          style="min-width: 250px;"
          :loading="addSelectionLoading"
        > {{ selectedGenres.length === 0 ? 'Go Back to Playlist' : 'Add Selection To Playlist'}}
          <q-tooltip v-if="totalNumberOfSongsInPlaylist.value >= maxNumberSongsInPlaylist">
            Maximum number of songs reached
          </q-tooltip>
        </q-btn>
      </div>
    <!-- <div class="row justify-center fixed-bottom-left">
      <q-btn
        v-if="showIcon"
        @click="addSelectionToPlaylist()"
        color="primary"
        size="18px"
        :disable="disabledAddSelectionButton()"
        :loading="addSelectionLoading"
        :icon="totalNumberOfSongs === 0 ? 'arrow_back' : 'add'"
      ></q-btn>
      <q-btn
        v-else
        @click="addSelectionToPlaylist()"
        color="primary"
        size="18px" 
        :disable="disabledAddSelectionButton()"
        style="min-width: 250px;"
        :loading="addSelectionLoading"
      > {{ totalNumberOfSongs === 0 ? 'Go Back to Playlist' : 'Add Selection To Playlist'}}
        <q-tooltip v-if="totalNumberOfSongsInPlaylist.value >= maxNumberSongsInPlaylist">
          Maximum number of songs reached
        </q-tooltip>
      </q-btn>
    </div> -->
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyRequests } from '../stores/requests'
import { useGenresStore } from '../stores/genres'
import { useGenreDataStore } from '../stores/genre-data'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { usePlaylistSectionsStore } from '../stores/playlist-sections'
import { useQuasar } from 'quasar'
// import { parseInt } from 'lodash'

const $q = useQuasar()
const router = useRouter()

const currentVersion = '1.0.1'

const requestsStore = useSpotifyRequests()
const genresStore = useGenresStore()
const genreDataStore = useGenreDataStore()
const playlistSectionsStore = usePlaylistSectionsStore()
const isMobile = ref(false)

const selectedGenres = ref([]) as any
const loadedGenresTree = ref([]) as any
const loadedGenresList = ref([]) as any
const autocompleteGenreList = ref([]) as any
const genrePlaying = ref('') as any
const treeFilter = ref('') as any

const spotifyAuthStore = useSpotifyAuthStore()
const market = spotifyAuthStore.market || 'US'

const sortButton = ref('pop') as any
const sortOptions = ref([
                  {label: 'Popularity', value: 'pop'},
                  {label: 'Alphabetical', value: 'alpha'}
                ])
const favoriteGenres = ref({}) as any
const expandedGenres = ref({}) as any
const loadingPlay = ref(false)
const songsPerGenre = ref(50)
const maxNumberSongsInPlaylist = 1000
const addSelectionLoading = ref(false)

onMounted(async () => {
  await loadGenres()
  loadFavoriteGenres()
  setGenreKeys()
  setGenresStoreValues()
  window.addEventListener("resize", resizeListener)
  resizeListener()
  // sort(sortButton.value)
})

onUnmounted(() => {
  window.removeEventListener("resize", resizeListener)
})

watch(() => sortButton.value, (value) => {
  genreDataStore.sortOption = value
})

watch(() => expandedGenres.value, (value) => {
  genresStore.expandedGenres = value
}, { deep: true })

function setGenreKeys() {
  for (const genre of loadedGenresTree.value) {
    expandedGenres.value[genre.name] = []
  }
}

function genrePlayColor(spotify_id: any) {
  if (spotify_id === genrePlaying.value) {
    return 'primary'
  }
  return $q.dark.isActive ? 'grey-2' : 'black'
}

function setGenresStoreValues() {
  if (genreDataStore.sortOption) {
    sortButton.value = genreDataStore.sortOption
  }
  if (genresStore.expandedGenres) {
    expandedGenres.value = genresStore.expandedGenres
  }
}

// function selectGenre(genre: any) {
//   selectedGenre.value = genre
// }

function disabledAddSelectionButton() {
  return totalNumberOfSongsInPlaylist.value > maxNumberSongsInPlaylist
}

function songsPerGenreChanged(value: any) {
  songsPerGenre.value = value
}

function resetFilter() {
  treeFilter.value = ''
  autocompleteGenreList.value = loadedGenresList.value
}

// function selectGenreFilterFunction(val: string, update: any, abort: any) {
//   update(() => {
//     const needle = val.toLocaleLowerCase()
//     autocompleteGenreList.value = loadedGenresList.value.filter((v: any) => v.name.toLocaleLowerCase().indexOf(needle) > -1)
//   })
// }

function updateFilter(val: any) {
  treeFilter.value = val
  const needle = val.toLocaleLowerCase()
  autocompleteGenreList.value = loadedGenresList.value.filter((v: any) => v.name.toLocaleLowerCase().indexOf(needle) > -1)
}

async function addSelectionToPlaylist() {
  addSelectionLoading.value = true
  if (selectedGenres.value.length === 0) {
    router.push({ path: '/'})
    addSelectionLoading.value = false
    return
  }
  for (const genre of selectedGenres.value) {
    if (genre.spotify_id === null) {
      addSelectionLoading.value = false
      return
    }
    const songs = await getSongs(genre, songsPerGenre.value >= 30, songsPerGenre.value)
    playlistSectionsStore.addGenreSongs(songs, genre.name)
  }
  selectedGenres.value = []
  $q.notify('Selected genres added to playlist')
  addSelectionLoading.value = false
}

async function playGenres(genres : any[]) {
  loadingPlay.value = true
  const songs = []
  const four = genres.length <= 2
  const nsongs = Math.ceil(50 / genres.length)
  for (const genre of genres) {
    songs.push(...await getSongs(genre, four, nsongs))
  }
  const shuffledSongs = songs.sort(() => Math.random() - 0.5)
  const playUrl = 'https://api.spotify.com/v1/me/player/play'
  const body = {
    // context_uri: context,
    uris: shuffledSongs.map((track: any) => track.uri),
  }
  requestsStore.putRequest(playUrl, body)
  loadingPlay.value = false
}

async function getSongs(genre: any, four: boolean, nsongs: number) {
  const url = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre.spotify_id)}"&type=track&limit=50&` + new URLSearchParams({market})
  const url2 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre.spotify_id)}"&type=track&limit=50&offset=50&` + new URLSearchParams({market})
  const url3 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre.spotify_id)}"&type=track&limit=50&offset=100&` + new URLSearchParams({market})
  const url4 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre.spotify_id)}"&type=track&limit=50&offset=150&` + new URLSearchParams({market})

  const urls = four ? [url, url2, url3, url4] : [url, url2]

  const promises = urls.map((url) => requestsStore.getRequest(url))
  const tracks = []
  await requestsStore.tryRefreshToken()
  for (const response of await Promise.all(promises)) {
    if (response?.data?.tracks?.items && response.status === 200) {
      tracks.push(...response.data.tracks.items)
    }
  }
  const shuffledTracks = tracks.sort(() => Math.random() - 0.5).slice(0, nsongs)
  return shuffledTracks
}

async function playGenre(spotify_id: any) {
  if (genrePlaying.value === spotify_id) {
    const skipToNextUrl = 'https://api.spotify.com/v1/me/player/next'
    requestsStore.postRequest(skipToNextUrl, {}, false)
    return
  }

  const url = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(spotify_id)}"&type=track&limit=50&` + new URLSearchParams({market})
  // const response = await requestsStore.getRequest(url)
  // if (response.status !== 200) {
  //   return
  // }
  // const data = response.data
  const url2 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(spotify_id)}"&type=track&limit=50&offset=50&` + new URLSearchParams({market})
  const url3 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(spotify_id)}"&type=track&limit=50&offset=100&` + new URLSearchParams({market})
  const url4 = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(spotify_id)}"&type=track&limit=50&offset=150&` + new URLSearchParams({market})

  const promises = [url, url2, url3, url4].map((url) => requestsStore.getRequest(url))
  const tracks = []
  await requestsStore.tryRefreshToken()
  for (const response of await Promise.all(promises)) {
    if (response?.data?.tracks?.items && response.status === 200) {
      tracks.push(...response.data.tracks.items)
    }
  }
  const shuffledTracks = tracks.sort(() => Math.random() - 0.5).slice(0, 50)
  if (shuffledTracks.length === 0) {
    return
  }

  const playUrl = 'https://api.spotify.com/v1/me/player/play'
  const body = {
    // context_uri: context,
    uris: shuffledTracks.map((track: any) => track.uri),
  }
  const response = await requestsStore.putRequest(playUrl, body)
  if (response.status !== 204) {
    return
  }
  genrePlaying.value = spotify_id
  // const tracksNotPlayed = tracks.filter((track: any) => !alreadyPlayedTracks.value[spotify_id].includes(track.id))
  // if (tracksNotPlayed.length === 0) {
  //   return
  // }
  // const track = tracksNotPlayed[Math.floor(Math.random() * tracksNotPlayed.length)]
  // alreadyPlayedTracks.value[spotify_id].push(track.id)

  //   // reset alreadyPlayedTracks if all songs have been played
  // if (alreadyPlayedTracks.value[spotify_id].length === tracks.length) {
  //   alreadyPlayedTracks.value[spotify_id] = []
  // }

  // genrePlaying.value = spotify_id
  // playSong(track)
}

// function playSong(song: any) {
//   emit('playSong', song, props.oneColumn ? 'mini_modal' : 'normal')
// }

async function random(five = false) {
  let possibleGenres = autocompleteGenreList.value.filter((genre: any) => genre.spotify_id !== null)
  if (treeFilter.value !== '') {
    possibleGenres = possibleGenres.concat(searchTree())
  }
  for (let i = 0; i < 5; i++) {
    if (selectedGenres.value[i] && selectedGenres.value[i].locked) {
      continue
    }
    if (possibleGenres.length === 0) {
      return
    }
    let genre = {} as any
    let count = 0
    while (true) {
      genre = possibleGenres[Math.floor(Math.random() * possibleGenres.length)]
      if (genre.spotify_id !== null && !selectedGenres.value.some((genre2: any) => genre2.spotify_id === genre.spotify_id)) {
        break
      }
      count++
      if (count > 20) { // if it can't find a genre after 20 tries, just return
        return
      }
    }
    genre.locked = false
    selectedGenres.value[i] = genre
    if (!five) {
      return
    }
  }
}

function searchTree() {
  // get all genres that are children if genre matches one of the base genres
  const ret = []
  const baseGenres = loadedGenresTree.value.filter((genre: any) => genre?.name?.toLowerCase().includes(treeFilter.value.toLowerCase()))
  for (const baseGenre of baseGenres) {
    ret.push(...searchTreeHelper(baseGenre))
  }
  return ret
}

function searchTreeHelper(genre: any): any {
  const ret = []
  if (genre.spotify_id !== null) {
    ret.push(genre)
  }
  if (genre.subgenres) {
    for (const subgenre of genre.subgenres) {
      ret.push(...searchTreeHelper(subgenre))
    }
  }
  return ret
}

// async function random5() {
//   for (let i = 0; i < 5; i++) {
//     if (selectedGenres.value[i] && selectedGenres.value[i].locked) {
//       continue
//     }
//     if (autocompleteGenreList.value.length === 0) {
//       return
//     }
//     const genre = autocompleteGenreList.value[Math.floor(Math.random() * autocompleteGenreList.value.length)]
//     genre.locked = false
//     selectedGenres.value[i] = genre
//   }
// }

async function genreSelected(details: any) {
  details.value.locked = false
}

function addGenre(genre: any) {
  if (selectedGenres.value.some((genre2: any) => genre2.spotify_id === genre.spotify_id)){
    // remove genre
    for (let i = 0; i < 5; i++) {
      if (selectedGenres.value[i].spotify_id === genre.spotify_id) {
        selectedGenres.value.splice(i, 1)
        return
      }
    }
  }
  if (genre.spotify_id === null || selectedGenres.value.length >= 5 || selectedGenres.value.some((genre2: any) => genre2.spotify_id === genre.spotify_id)) {
    return
  }
  for (let i = 0; i < 5; i++) {
    if (selectedGenres.value[i] === undefined) {
      genre.locked = false
      selectedGenres.value[i] = genre
      return
    }
  }
}

async function loadGenres() {
  if (genreDataStore.genresList && genreDataStore.genresTree && genreDataStore.version === currentVersion) {
    loadedGenresList.value = genreDataStore.genresList
    loadedGenresTree.value = genreDataStore.genresTree
    genresStore.favoritesLoaded = true
  } else {
    const res = await fetch(process.env.NODE_ENV === 'development' ? 'data/mini_genre_list.json' : 'data/genre_list.json')
    loadedGenresList.value = await res.json()
    const res2 = await fetch(process.env.NODE_ENV === 'development' ? 'data/mini_genre_tree.json' : 'data/genre_tree.json')
    loadedGenresTree.value = await res2.json()
    genreDataStore.version = currentVersion
    genreDataStore.sortOption = 'pop'
    updateGenresStore()
  }
  autocompleteGenreList.value = loadedGenresList.value
}

async function loadFavoriteGenres() {
  if (genresStore.favoritesLoaded) { // favorites must be loaded each time since it changes with user listen history, annoying though
    sortOptions.value.push({label: 'Affinity', value: 'affinity'})
    return
  }
  requestFavoriteGenres()
  // autocompleteGenreList.value = loadedGenresList.value
  genresStore.favoritesLoaded = true
  sortOptions.value.push({label: 'Affinity', value: 'affinity'})
}

async function requestFavoriteGenres() {
  const timeRanges = ['short_term', 'medium_term', 'long_term']
  const promises = timeRanges.map((timeRange) => loadFavoriteGenresForTimeRange(timeRange))
  await Promise.all(promises)
  // for (const timeRange of timeRanges) {
  //   await loadFavoriteGenresForTimeRange(timeRange)
  // }
  //gl as array of favoriteGenres like [{genre: 'pop', affinity: 5}, {genre: 'rock', affinity: 3}]
  // const gl = Object.keys(favoriteGenres.value).map((key) => {
  //   return {spotify_id: key, affinity: favoriteGenres.value[key]}
  // })
  // console.log(gl.sort((a: any, b: any) => (a.affinity > b.affinity) ? 1 : -1))
  insertFavoriteGenresIntoTree(loadedGenresTree.value)
  insertFavoriteGenresIntoList(loadedGenresList.value)
  updateGenresStore()
}

function updateGenresStore() {
  genreDataStore.genresList = loadedGenresList.value
  genreDataStore.genresTree = loadedGenresTree.value
}

function insertFavoriteGenresIntoTree(genres: any[]): number {
  // inserts favorite values from favoriteGenres variable into tree genre objects with same genre value as the key
  let totalAffinity = 0
  for (const genre of genres) {
    if (favoriteGenres.value[genre.spotify_id] !== undefined) {
      if (genre.affinity === undefined) {
        genre.affinity = favoriteGenres.value[genre.spotify_id]
      } else {
        genre.affinity += favoriteGenres.value[genre.spotify_id]
      }
      totalAffinity += genre.affinity
    }
    if (genre.subgenres && genre.subgenres.length > 0) {
      const subgenresAffinity = insertFavoriteGenresIntoTree(genre.subgenres)
      if (genre.affinity === undefined) {
        genre.affinity = subgenresAffinity
      } else {
        genre.affinity += subgenresAffinity
      }
      totalAffinity += subgenresAffinity
    }
  }
  return totalAffinity
}

function insertFavoriteGenresIntoList(genres: any[]) {
  // inserts favorite values from favoriteGenres variable into list genre objects with same genre value as the key
  for (const genre of genres) {
    if (favoriteGenres.value[genre.spotify_id] !== undefined) {
      genre.affinity = favoriteGenres.value[genre.spotify_id]
    }
  }
}

async function loadFavoriteGenresForTimeRange(timeRange: string) {
  const url = `https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=${timeRange}`
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  var data = response.data
  for (const artist of data.items) {
    const genres = artist.genres
    for (const genre of genres) {
      if (favoriteGenres.value[genre] === undefined) {
        favoriteGenres.value[genre] = 1
      } else {
        favoriteGenres.value[genre] += 1
      }
    }
  }
}

// function formYears() {
//   if (selectedYears.value === 'all') {
//     return ''
//   }
//   if (selectedYears.value === 'custom') {
//     return `${startYear.value}-${endYear.value}`
//   }
//   return selectedYears.value
// }

async function sort(type: string) {
  if (type === 'pop') {
    loadedGenresList.value = [...loadedGenresList.value].sort((a: any, b: any) => (a.popularity > b.popularity) ? 1 : -1)
    loadedGenresTree.value = sortGenresByPopularity([...loadedGenresTree.value])
  } else if (type === 'affinity') {
    loadedGenresList.value = [...loadedGenresList.value].sort((a: any, b: any): number => {
      const aAffinity = a.affinity ? a.affinity : -1
      const bAffinity = b.affinity ? b.affinity : -1
      return (aAffinity > bAffinity) ? -1 : 1
    })
    loadedGenresTree.value = sortGenresByAffinity([...loadedGenresTree.value])
  } 
  else {
    loadedGenresList.value = [...loadedGenresList.value].sort((a: any, b: any) => a.name.localeCompare(b.name))
    loadedGenresTree.value = sortGenresAlphabetically([...loadedGenresTree.value])
  }

  if (treeFilter.value !== '') {
    updateFilter(treeFilter.value)
  } else {
    autocompleteGenreList.value = loadedGenresList.value
  }
  updateGenresStore()
}

function sortGenresByPopularity(genresSelected: any[]){
  //sorts genres and subgenres by popularity
  const sortedGenres = [...genresSelected].sort((a: any, b: any) => (a.popularity > b.popularity) ? 1 : -1)
  for (const genre of sortedGenres) {
    if (genre.subgenres && genre.subgenres.length > 0) {
      genre.subgenres = sortGenresByPopularity(genre.subgenres)
    }
  }
  return sortedGenres
}

function sortGenresAlphabetically(genresSelected: any[]){
  //sorts genres and subgenres by alphabetical
  const sortedGenres = [...genresSelected].sort((a, b) => a.name.localeCompare(b.name))
  for (const genre of sortedGenres) {
    if (genre.subgenres && genre.subgenres.length > 0) {
      genre.subgenres = sortGenresAlphabetically(genre.subgenres)
    }
  }
  return sortedGenres
}

function sortGenresByAffinity(genresSelected: any[]){
  //sorts genres and subgenres by affinity, if affinity is not defined it should be last
  const sortedGenres = [...genresSelected].sort((a: any, b: any): number => {
    const aAffinity = a.affinity ? a.affinity : -1
    const bAffinity = b.affinity ? b.affinity : -1
    return (aAffinity > bAffinity) ? -1 : 1
  })
  for (const genre of sortedGenres) {
    if (genre.subgenres && genre.subgenres.length > 0) {
      genre.subgenres = sortGenresByAffinity(genre.subgenres)
    }
  }
  return sortedGenres
}

function numberOfSubgenres(genre: any): number {
  let count = 0
  if (genre.subgenres) {
    count += genre.subgenres.length
    genre.subgenres.forEach((subgenre: any) => {
      count += numberOfSubgenres(subgenre)
    })
  }
  return count
}

function subgenresLabel(genre: any): string {
  const count = numberOfSubgenres(genre)
  if (count === 0) {
    return ''
  }
  return ` (${count} subgenres)`
}

// function genreIcon(genre: any): string {
//   if (genre === selectedGenre?.value?.spotify_id) {
//     return 'radio_button_checked'
//   }
//   return 'radio_button_unchecked'
// }

function resizeListener() {
  const width = window.innerWidth
  if (width < 1024) {
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

const numberOfSongsSelected = computed(() => {
  return selectedGenres.value.length * songsPerGenre.value
})

const numberSongsInPlaylist = computed(() => {
  return playlistSectionsStore.playlistSongs.length
})

const totalNumberOfSongsInPlaylist = computed(() => {
  return numberOfSongsSelected.value + numberSongsInPlaylist.value
})
</script>

<style>
.body--dark  {
  .q-tree--dark .q-tree__node-header-content {
    color: rgb(220, 220, 220);
  }
}
</style>
