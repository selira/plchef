<template>
  <q-card style="min-width: 70%; align-self: center;">
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div>
        <q-card-section>
          <div class="row justify-between">
            <div class='row'>
              <q-select
                filled
                dense
                label="Select Genre"
                v-model="selectedGenre"
                :options="autocompleteGenreList"
                option-label="name"
                option-value="spotify_id"
                style="width: 200px;"
                clearable 
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <div v-if="spotifyAuthStore.isPremium">
                <q-btn
                  round
                  :color="genrePlayColor(selectedGenre?.spotify_id)"
                  :size="!oneColumn? '11px' : '11px'"
                  icon="arrow_right"
                  :text-color="$q.dark.isActive ? 'black' : 'white'"
                  @click.stop="playGenre(selectedGenre?.spotify_id)"
                  :disable="!selectedGenre?.spotify_id"
                  class="q-ml-sm q-mt-xs"
                />
              </div>
              <div>
                <q-btn
                  :dense="oneColumn"
                  label="Random"
                  @click="selectedGenre = loadedGenresList[Math.floor(Math.random() * loadedGenresList.length)]"
                  class="q-ml-sm q-mt-xs"
                  color="accent"
                />
              </div>
            </div>
            <div>
              <q-select
                v-model="sortButton"
                :options="sortOptions"
                label="Sort by"
                dense
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
            <div class="self-end">
              <q-input
                dense
                filled
                :model-value="treeFilter"
                label="Search"
                @update:model-value="updateFilter"
                style="width: 150px;"
                debounce="500"
              >

                <template v-slot:append>
                  <q-icon v-if="treeFilter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </div>
      <q-separator />

      <div style="min-height: 0px; flex: 1 1 auto; overflow-y: auto;">
      <!-- <q-card-section class="scroll col-9" style="max-height: 65vh; min-height: 60vh;">  -->
        <q-card-section>
          <div :class="{'q-pa-md': !oneColumn, 'q-gutter-sm': !oneColumn}">
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
                  <q-radio
                    v-model="selectedGenre"
                    :val="prop.node"
                    :disable="prop.node.spotify_id === null"
                    padding="none"
                    :size="!oneColumn? 'lg' : 'xl'"
                    dense
                  />
                  <q-btn
                    v-if="spotifyAuthStore.isPremium"
                    dense
                    round
                    :color="genrePlayColor(prop.node.spotify_id)"
                    :size="!oneColumn? '11px' : '14px'"
                    icon="arrow_right"
                    :text-color="$q.dark.isActive ? 'black' : 'white'"
                    @click.stop="playGenre(prop.node.spotify_id)"
                    :disable="prop.node.spotify_id === null"
                    class="q-ml-sm"
                  >
                    <!-- <q-tooltip v-if="!oneColumn">
                      {{ prop.node.spotify_id === null ? 'No Preview Available' : 'Play Random Preview Clip' }}
                    </q-tooltip> -->
                  </q-btn>
                  <span class="q-ml-sm textColor">{{ prop.node.name + ' ' + subgenresLabel(prop.node) }}</span>
                </div>
              </template>
            </q-tree>
            </div>
          </div>
        </q-card-section>
      </div>
      <q-separator />
      <div>
        <q-card-section>
          <q-btn @click="searchGenre" color="primary" class="q-mr-sm">Search Genre</q-btn>
          <q-btn @click="closeDialog" color="negative" click="negative">Cancel</q-btn>
        </q-card-section>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
// import genresTree from '../data/genre_tree_with_index2.json'
// import genresTree from '../data/genre_tree.json'
// import genresList from '../data/genre_list.json'
import { useSpotifyRequests } from '../stores/requests'
import { useGenresStore } from '../stores/genres'
import { useGenreDataStore } from '../stores/genre-data'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { useQuasar } from 'quasar'
// import { parseInt } from 'lodash'

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'searchGenre', selection: any): void
  (e: 'playSong', song: any, playerType: string): void
  (e: 'closePlayer'): void
}>()

const $q = useQuasar()

const currentVersion = '1.0.1'

const props = defineProps<{ oneColumn: boolean }>()

const requestsStore = useSpotifyRequests()
const genresStore = useGenresStore()
const genreDataStore = useGenreDataStore()

const selectedGenre = ref(null) as any
const loadedGenresTree = ref([]) as any
const loadedGenresList = ref([]) as any
const loadingGenresTree = ref([]) as any
const loadingGenresList = ref([]) as any
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

onMounted(async () => {
  $q.loading.show({message: 'Loading genres...'})
  await loadGenres()
  setGenreKeys()
  setGenresStoreValues()
  // sort(sortButton.value)
  $q.loading.hide()
})

watch(() => sortButton.value, (value) => {
  genreDataStore.sortOption = value
})

watch(() => selectedGenre.value, () => {
  genresStore.selectedGenre = selectedGenre.value
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
  if (genresStore.selectedGenre) {
    selectedGenre.value = genresStore.selectedGenre
  }
  if (genresStore.expandedGenres) {
    expandedGenres.value = genresStore.expandedGenres
  }
}

// function selectGenre(genre: any) {
//   selectedGenre.value = genre
// }

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

function closeDialog() {
  if (props.oneColumn) {
    emit('closePlayer')
  }
  emit('closeDialog')
}

function searchGenre() {
  // if (selectedSpotifyId.value !== '') {
  //   emit('searchGenre', selectedSpotifyId.value)
  //   return
  // }
  // const gl = loadedGenresList.value as any
  // var genre = gl.find((item: any) => item.name === selectedGenre.value)
  // if (genre === undefined) {
  //   emit('searchGenre', selectedGenre.value)
  //   return
  // }
  if (props.oneColumn) {
    emit('closePlayer')
  }
  emit('searchGenre', selectedGenre.value.spotify_id)
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

async function loadGenres() {
  if (genreDataStore.genresList && genreDataStore.genresTree && genreDataStore.version === currentVersion) {
    loadingGenresList.value = JSON.parse(JSON.stringify(genreDataStore.genresList))
    loadingGenresTree.value = JSON.parse(JSON.stringify(genreDataStore.genresTree))
  } else {
    const res = await fetch(process.env.NODE_ENV === 'development' ? 'data/mini_genre_list.json' : 'data/genre_list.json')
    loadingGenresList.value = await res.json()
    const res2 = await fetch(process.env.NODE_ENV === 'development' ? 'data/mini_genre_tree.json' : 'data/genre_tree.json')
    loadingGenresTree.value = await res2.json()
    genreDataStore.version = currentVersion
    genreDataStore.sortOption = 'pop'
  }
  if (spotifyAuthStore.isLoggedIn) {
    await loadFavoriteGenres()
  }
  loadedGenresList.value = loadingGenresList.value
  loadedGenresTree.value = loadingGenresTree.value
  autocompleteGenreList.value = loadedGenresList.value
  updateGenresStore()
}

async function loadFavoriteGenres() {
  if (genreDataStore.favoritesLoaded) { // favorites must be loaded each time since it changes with user listen history, annoying though
    sortOptions.value.push({label: 'Affinity', value: 'affinity'})
    return
  }
  await requestFavoriteGenres()
  // autocompleteGenreList.value = loadedGenresList.value
  genreDataStore.favoritesLoaded = true
  sortOptions.value.push({label: 'Affinity', value: 'affinity'})
}

async function requestFavoriteGenres() {
  const timeRanges = ['short_term', 'medium_term', 'long_term']
  const promises = timeRanges.map((timeRange) => loadFavoriteGenresForTimeRange(timeRange))
  await Promise.all(promises)
  insertFavoriteGenresIntoTree(loadingGenresTree.value)
  insertFavoriteGenresIntoList(loadingGenresList.value)
}

function updateGenresStore() {
  genreDataStore.genresList = JSON.parse(JSON.stringify(loadedGenresList.value))
  genreDataStore.genresTree = JSON.parse(JSON.stringify(loadedGenresTree.value))
}

function insertFavoriteGenresIntoTree(genres: any[]): number {
  // inserts favorite values from favoriteGenres variable into tree genre objects with same genre value as the key
  let totalAffinity = 0
  for (const genre of genres) {
    genre.affinity = 0
    if (favoriteGenres.value[genre.spotify_id] !== undefined) {
      genre.affinity += favoriteGenres.value[genre.spotify_id]
    }
    if (genre.subgenres && genre.subgenres.length > 0) {
      const subgenresAffinity = insertFavoriteGenresIntoTree(genre.subgenres)
      genre.affinity += subgenresAffinity
    }
    totalAffinity += genre.affinity
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
</script>

<style>
.body--dark  {
  .q-tree--dark .q-tree__node-header-content {
    color: rgb(220, 220, 220);
  }
}
</style>
