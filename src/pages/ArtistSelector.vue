<template>
  <q-page class="row justify-evenly">
    <div class="column" style="min-width: 100%;">
    <div class="row justify-evenly" :style="numberOfCols > 2 ? 'height: 125px' : ''">
      <div :class="menuOptionsClass">
        <div>
          <q-input
            v-model="search"
            filled
            debounce="500"
            placeholder="Search artist by name"
            @update:model-value="searchChanged"
            ref="searchInput"
            @click="searchInputClicked"
            style="max-width: 300px;"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div>
          <q-menu v-model="searchShowing" no-focus>
            <q-list
              v-if="search !== ''"
              bordered
              separator
              dense
            >
              <q-item
                v-for="artist in searchedArtists"
                :key="artist.id"
                clickable
                @click="selectRelatedArtists([artist])"
              >
                <q-item-section avatar>
                  <q-avatar v-if="spotifyImage(artist, 'low-res') !== ''" square>
                    <img :src="spotifyImage(artist, 'low-res')"/>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ artist.name }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </div>

      <div :class="menuOptionsClassWithoutPadding">
        <div class="col q-pa-md">
          <q-select
            v-model="artistQuery"
            label="Artist Selection"
            :options="artistQueries"
            option-label="title"
            @update:model-value="artistsQueryChanged"
            text-color="red"
          ></q-select>
        </div>
        <div class="col q-pt-md q-pl-md q-pr-md q-pb-none">
          <q-btn @click="openGenreDialog()" color="accent">
            Select Genre
          </q-btn>
          <div> {{ selectedGenreName }}</div>
          <q-checkbox
            v-model="exactGenreMatch"
            label="Exact Match"
            color="accent"
            v-if="selectedGenreName !== ''"
          />
        </div>
      </div>

      <div :class="menuOptionsClassWithoutPadding">
        <div class="col-5 q-pt-md q-pl-md q-pr-md q-pb-xs">
          <q-select 
            v-model="defaultArtistSelection"
            label="Default Song Selection"
            stack-label
            :options="artistSelections"
            option-label="title"
            @update:model-value="defaultArtistSelectionChanged"
          ></q-select>
        </div>
        <div class="col-7 q-pt-md q-pl-md q-pr-md q-pb-xs">
          <div v-if="defaultArtistSelection.value === 'top-10'">
            <q-badge color="secondary">
              Default Number of Songs: {{ defaultNumberOfSongs }}
            </q-badge>

            <q-slider
              :model-value="defaultNumberOfSongs"
              @change="defaultNumberOfSongsChanged"
              :min="1"
              :max="10"
              :step="1"
              color="primary"
              label
            />

            <q-toggle
              v-model="shuffleTopTen"
              label="Shuffle"
              color="purple"
            >
              <q-tooltip>
                Shuffle the top ten songs, only the {{ defaultNumberOfSongs }} first will be added
              </q-tooltip>
            </q-toggle>
          </div>
          <div v-else-if="defaultArtistSelection.value === 'recommendations'">
            <q-toggle
              v-model="automaticRecommendations"
              label="Automatic Recommendations"
              color="primary"
            />
            <q-card 
              @click="openAutomaticRecommendationsDialog" 
              style="cursor: pointer;"
              flat
              bordered
            >
              <q-card-section class="q-ma-none q-pa-none">
                <div class="text-subtitle1 ellipsis q-ml-xs">N° songs: {{ automaticRecommendationsNumberOfSongs }}</div>
                <div class="text-subtitle2 q-ml-xs">Popularity: {{ automaticRecommendationsPopularity ? automaticRecommendationsPopularity : 'None' }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div v-else-if="defaultArtistSelection.value === 'random'">
            <q-badge color="secondary">
              Default Number of Songs: {{ randomSelectionNumberOfSongs }}
            </q-badge>
            <q-slider
              v-model="randomSelectionNumberOfSongs"
              label
              color="primary"
              :min="1"
              :max="100"
              :step="1"
            />
            <q-toggle
              v-model="prioritizePopularAlbums"
              label="Prioritize popular albums"
              color="purple"
            >
            </q-toggle>

          </div>
          <div v-else-if="defaultArtistSelection.value === 'most-popular'">
            <q-badge color="secondary">
              Number Of Albums: {{ defaultNumberOfAlbums }}
            </q-badge>

            <q-slider
              v-model="defaultNumberOfAlbums"
              :min="1"
              :max="40"
              :step="1"
              color="primary"
              label
            />
          </div>
        </div>
      </div>

      <div :class="menuOptionsClassWithoutPadding">
        <div class="col q-pa-md greyText">
          <div> Songs selected: {{ totalNumberOfSongs }} </div>
          <div> Songs in playlist: {{ numberSongsInPlaylist }} </div>
          <div :style="totalNumberOfSongsInPlaylist > maxNumberSongsInPlaylist ? 'color: red' : ''"> 
            Total songs: {{ totalNumberOfSongsInPlaylist }} / {{ maxNumberSongsInPlaylist }}
          </div>
        </div>
        <div class="col q-pa-md">
          <q-btn
            color="dark"
            @click="clearArtistSelection"
            text-color="grey-3"
          >Clear Selection</q-btn>
        </div>
      </div>

    </div>

    <div class="row" ref="artistsDiv">
      <div
        v-for="(artist, i) in shownArtists"
        :key="artist.id"
        :class="artistCardClass"
      >
        <ArtistCard
          v-model="shownArtists[i]"
          :artistImageResolution="artistImageResolution"
          :numberOfCols="numberOfCols"
          :shuffleTopTen="shuffleTopTen"
          :automaticRecommendationsInfo="automaticRecommendationsInfo"
          :disable-selection="totalNumberOfSongsInPlaylist >= maxNumberSongsInPlaylist"
          :defaultArtistSelection="defaultArtistSelection.value"
          :squeezeArtistImage="squeezeArtistImage"
          :defaultNumberOfSongs="defaultNumberOfSongs"
          :defaultNumberOfRandomSongs="randomSelectionNumberOfSongs"
          :prioritizePopularAlbums="prioritizePopularAlbums"
          :defaultNumberOfAlbums="defaultNumberOfAlbums"
          @update-selected-artists-store="updateSelectedArtistsStore"
          @playSong="playSong"
          @showRelatedArtists="openRelatedArtistsDialog"
          @openRecommendationsDialog="openRecommendationsDialog"
          @openCatalogDialog="openCatalogDialog"
          @openSongEditorDialog="openSongEditorDialog"
        />
      </div>
    </div>
    <div class="row" v-if="shownArtists.length === 0">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ noArtistsText() }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <br>
        <div class="row justify-center">
          <q-pagination
            v-if="artistQuery.value === 'search-genre' || artistQuery.value === 'followed-artists'"
            v-model="pageNumber"
            :max="maxPageNumber"
            direction-links
            unelevated
            color="black"
            active-color="purple"
            @update:model-value="pageNumberChange"
            :disable="dialogOpen()"
            :max-pages="numberOfCols > 1 ? 10 : 6"
          />
        </div>
        <br>
        <br>
        <br>
        <br>
      </div>
    </div>
    <div class="row justify-center fixed-bottom-left">
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
    </div>
    </div>
    <q-dialog
      v-model="genreSelectorDialog"
      full-height
      :backdrop-filter=bFilter
      :maximized="maximizedModals"
      @escape-key="router.go(-1)"
    >
      <GenreSelector
        :oneColumn="numberOfCols === 1"
        @search-genre="searchGenre"
        @close-dialog="genreSelectorDialog = false; router.go(-1)"
        @play-song="playSong"
        @closePlayer="closePlayer"
      ></GenreSelector>
    </q-dialog>
    <q-dialog
      v-model="catalogDialog"
      full-width
      :full-height="numberOfCols <= 3"
      no-backdrop-dismiss
      :maximized="maximizedModals"
      :backdrop-filter=bFilter
      @escape-key="router.go(-1)"
    >
      <CatalogSelector
        :artist="selectedCatalogArtist"
        :maxNumberofSongs="maxNumberSongsInPlaylist"
        :oneColumn="numberOfCols === 1"
        @close-dialog="catalogDialog = false; router.go(-1)"
        @select-songs="catalogSelectorSongsSelected"
        @play-song="playSong"
        @closePlayer="closePlayer"
      ></CatalogSelector>
    </q-dialog>

    <!-- <q-dialog
      v-model="relatedArtistsDialog"
      full-width
      :full-height="maximizedModals"
      no-backdrop-dismiss
      :maximized="maximizedModals"
      :backdrop-filter=bFilter
      @escape-key="router.go(-1)"
    >
      <RelatedArtistsSelector
        :artist="relatedArtistsSelectedArtist"
        :artistIds="artistIds"
        :oneColumn="numberOfCols === 1"
        @playSong="playSong"
        @select-related-artists="selectRelatedArtists"
        @close-dialog="relatedArtistsDialog = false; router.go(-1)"
      ></RelatedArtistsSelector>
    </q-dialog>
    <q-dialog
      v-model="recommendationsDialog"
      :backdrop-filter=bFilter
      @escape-key="router.go(-1)"
      :maximized="maximizedModals"
    >
      <ArtistRecommendations
        :artist="recommendationsArtist"
        @save-recommendations="saveRecommendations"
        @close-dialog="recommendationsDialog = false; router.go(-1)"
      ></ArtistRecommendations>
    </q-dialog>
    <q-dialog
      v-model="automaticRecommendationsDialog"
      :backdrop-filter=bFilter
      @escape-key="router.go(-1)"
      :maximized="maximizedModals"
    >
      <AutomaticArtistRecommendations
        :automaticRecommendationsNumberOfSongs="automaticRecommendationsNumberOfSongs"
        :automaticRecommendationsPopularity="automaticRecommendationsPopularity"
        @save-recommendations="saveAutomaticRecommendations"
        @close-dialog="automaticRecommendationsDialog = false; router.go(-1)"
      ></AutomaticArtistRecommendations>
    </q-dialog> -->
    <q-dialog
      v-model="songEditorDialog"
      no-backdrop-dismiss
      :maximized="maximizedModals"
      full-height
      :backdrop-filter=bFilter
      @escape-key="router.go(-1)"
      :class="{'z-max': numberOfCols === 1}"
    >
      <ArtistSongEditor
        :artist="songEdtiorArtist"
        :numberOfCols="numberOfCols"
        @close-dialog="songEditorDialog = false; router.go(-1)"
        @confirm-selection="confirmArtistSongEditorSelection"
        @playSong="playSong"
      ></ArtistSongEditor>
    </q-dialog>
  </q-page>

</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, toRaw } from 'vue'
import GenreSelector from '../components/GenreSelector.vue'
import CatalogSelector from '../components/CatalogSelector.vue'
import ArtistSongEditor from 'src/components/ArtistSongEditor.vue'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { usePlaylistSectionsStore } from '../stores/playlist-sections'
import { useSelectedArtistsStore } from '../stores/selected-artists'
import { useRouter, useRoute } from 'vue-router'
import { spotifyImage } from '../functions/utils'
import type { Ref } from 'vue'
import ArtistCard from '../components/ArtistCard.vue'
import { onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

const emit = defineEmits<{
  (e: 'playSong', song: any, playerType: string, context: any): void
  (e: 'closePlayer'): void
}>()

defineExpose({
  selectRelatedArtists
})

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const requestsStore = useSpotifyRequests()
const playlistSectionsStore = usePlaylistSectionsStore()
const selectedArtistsStore = useSelectedArtistsStore()
const spotifyAuthStore = useSpotifyAuthStore()
const market = spotifyAuthStore.market || 'US'
const maxNumberSongsInPlaylist = 1000
const genreArtistsPerPage = 50
const followedArtistsPerPage = 20
const bFilter = ref('sepia(90%)')
const exactGenreMatch = ref(false)
const prioritizePopularAlbums = ref(false)

const artists = ref([]) as any
// const selectedArtists = ref([]) as any
const artistQueries = [
  {title: 'My Top Artists (Short Term - 4 weeks)', value: 'top-short'},
  {title: 'My Top Artists (Medium Term - 6 months)', value: 'top-medium'},
  {title: 'My Top Artists (Long Term - all time)', value: 'top-long'},
  {title: 'Search for Genre', value: 'search-genre'},
  {title: 'Followed Artists', value: 'followed-artists'}
]
const stringMapping = {
  'top-short': 'short_term',
  'top-medium': 'medium_term',
  'top-long': 'long_term'
} as any
const artistSelections = [
  {title: 'Top 10 songs', value: 'top-10', description: 'Top 10 songs'},
  {title: 'Latest release', value: 'latest-release', description: 'Latest release'},
  {title: 'Browse catalog', value: 'browse-catalog', description: 'Songs from catalog'},
  // {title: 'Recommended songs', value: 'recommendations', description: 'Recommended songs based on artist'},
  {title: 'Most popular album', value: 'most-popular', description: 'Most popular album'},
  {title: 'Random Selection', value: 'random', description: 'Random selection from Catalog'}
]

const relatedArtistsDialog = ref(false)
const genreSelectorDialog = ref(false)
const catalogDialog = ref(false)
const recommendationsDialog = ref(false)
const songEditorDialog = ref(false)
const automaticRecommendationsDialog = ref(false)
const relatedArtistsSelectedArtist = ref({}) as any
const selectedCatalogArtist = ref({}) as any
const recommendationsArtist = ref({}) as any
const songEdtiorArtist = ref({}) as any
const addSelectionLoading = ref(false)
const showIcon = ref(false)

const defaultArtistSelection = ref({title: 'Top 10 songs', value: 'top-10', description: 'Top 10 songs'})
const artistQuery = ref({title: 'My Top Artists (Short Term - 4 weeks)', value: 'top-short'})
const nextArtistsUrl = ref('')
const defaultNumberOfSongs = ref(5)
const defaultNumberOfAlbums = ref(1)

const numberOfCols = ref(0)
const pageNumber = ref(1)
const maxPageNumber = ref(1)
const maximizedModals = ref(false)
const squeezeArtistImage = ref(false)

const selectedGenre = ref('')
const selectedGenreName = ref('')

const genresMaxPageNumber = ref({'pop': 20}) as any
const followedArtistsMaxPageNumber = ref(1)
const followedArtistCursors = ref({}) as any // key: pageNumber, value: cursor
const search = ref('')
const searchedArtists = ref([]) as any
const searchShowing = ref(false)
const searchInput = ref(null) as any
const artistsDiv = ref(null) as any
const shuffleTopTen = ref(false)
const automaticRecommendations = ref(true)
const automaticRecommendationsNumberOfSongs = ref(100)
const automaticRecommendationsPopularity = ref(null) as Ref<number | null>
const randomSelectionNumberOfSongs = ref(20)

const loadingArtists = ref(true)
const oldRouteQuery = ref({}) as any

onMounted(async () => {
  if (!spotifyAuthStore?.isLoggedIn) {
    router.push({ path: '/' })
    return
  }
  // checkAuth()
  loadingArtists.value = true
  // make copy of old route query to avoid infinite loop
  oldRouteQuery.value = Object.assign({}, route.query)
  if (selectedArtistsStore.selectedArtists?.length > 0) {
    selectedArtistsStore.selectedArtists.forEach((artist: any) => {
      artists.value.push(artist)
    })
  }
  setArtistQuery()
  const loadedArtists = await getArtists()
  saveArtists(loadedArtists, true)
  window.addEventListener("resize", resizeListener)
  window.addEventListener('popstate', closeAllDialogs)
  resizeListener()
  // window.addEventListener("resize", showSmallerAddToPlaylistButton)
  loadingArtists.value = false
})

onUnmounted(() => {
  window.removeEventListener("resize", resizeListener)
  window.removeEventListener("popstate", closeAllDialogs)
  // window.removeEventListener("resize", showSmallerAddToPlaylistButton)
})

watch(defaultArtistSelection, async (newDefault) => {
  for (const artist of artists.value) {
    if (!selectedArtistIds.value.includes(artist.id)) {
      artist.selection = newDefault
    }
  }
})

watch(defaultNumberOfSongs, async (newDefault) => {
  for (const artist of artists.value) {
    if (!selectedArtistIds.value.includes(artist.id)) {
      artist.numberOfSongs = newDefault
    }
  }
})

const selectedArtists = computed(() => {
  return artists.value?.filter((artist: any) => artist.selected)
})

const selectedArtistIds = computed(() => {
  return selectedArtists.value?.map((artist: any) => artist.id)
})

// const artistIds = computed(() => {
//   return artists.value.map((artist: any) => artist.id)
// })

const shownArtists = computed(() => {
  // show only artist with exact genre match if that is the case
  if (exactGenreMatch.value && selectedGenre.value !== '') {
    return artists.value.filter(function(artist: any) {
      if (artist.selected) {
        return true
      }
      for (const genre of artist.genres) {
        if (genre.toLowerCase() === selectedGenre.value.toLowerCase()) {
          return true
        }
      }
      return false
    })
  }
  return artists.value
})

const automaticRecommendationsInfo = computed(() => {
  return {
    numberOfSongs: automaticRecommendationsNumberOfSongs.value,
    popularity: automaticRecommendationsPopularity.value,
    activated: automaticRecommendations.value
  }
})

// watch(selectedArtists, async (newSelected, _oldSelected) => {
//   selectedArtistsStore.selectedArtists = newSelected
// }, { deep: true })

watch(route, async (newRoute) => {
  if (JSON.stringify(newRoute.query) === JSON.stringify(oldRouteQuery.value)) return
  loadingArtists.value = true
  oldRouteQuery.value = Object.assign({}, newRoute.query)
  selectedGenreName.value = ''
  setArtistQuery()
  const loadedArtists = await getArtists()
  saveArtists(loadedArtists)
  // doesn't work very well with 20 per page.
  if (route.query.page && numberOfCols.value === 1) {
    artistsDiv.value.scrollIntoView({ behavior: "smooth" })
  }
  loadingArtists.value = false
})

function updateSelectedArtistsStore() {
  selectedArtistsStore.selectedArtists = selectedArtists.value
}

async function getArtists() {
  const response = await requestsStore.getRequest(getArtistsUrl())
  if (response.status !== 200) {
    return
  }
  var data = response.data
  if (artistQuery.value.value === 'search-genre' || artistQuery.value.value === 'followed-artists') {
    data = data.artists
  }
  if (!response.cached) {  
    data.items.forEach((artist: any) => {
      delete artist.followers
      delete artist.href
      delete artist.type
      artist.genres?.reverse()
    })
  }

  nextArtistsUrl.value = data.next
  if (data.next && maxPageNumber.value === pageNumber.value) {
    if (maxPageNumber.value === 20) {
      return data.items
    }
    maxPageNumber.value += 1
    if (artistQuery.value.value === 'search-genre') {
      genresMaxPageNumber.value[selectedGenre.value] = maxPageNumber.value
    }
    else if (artistQuery.value.value === 'followed-artists') {
      followedArtistsMaxPageNumber.value = maxPageNumber.value
      followedArtistCursors.value[maxPageNumber.value] = data.cursors.after
    }
  }
  return data.items
}

function getArtistsUrl(): string {
  const string = artistQuery as any
  if (string.value.value === 'search-genre') {
    let url = `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(selectedGenre.value)}"&type=artist&limit=${genreArtistsPerPage}`
    // let url = `https://api.spotify.com/v1/search?q=genre:"${selectedGenre.value}"&type=artist&limit=50`
    if (pageNumber.value > 1) {
      url += `&offset=${(pageNumber.value - 1) * genreArtistsPerPage}`
    }
    return url
  }
  if (string.value.value === 'followed-artists') {
    let url = `https://api.spotify.com/v1/me/following?type=artist&limit=${followedArtistsPerPage}`
    if (pageNumber.value > 1) {
      url += `&after=${followedArtistCursors.value[pageNumber.value]}`
    }
    return url
  }
  const timeRange = stringMapping[string.value.value]
  return `https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=${timeRange}`

}

function saveArtists(apiArtists: any[], atBeggining = false) {
  const savedArtists = addDefaultValuesToApiArtists(apiArtists)
  selectedArtists.value.forEach((artist: any) => {
    const foundArtistIndex = savedArtists.findIndex((art: any) => art.id === artist.id)
    if (foundArtistIndex !== -1) {
      if (atBeggining) {
        // remove foundArtist from savedArtists before adding it to the beggining
        savedArtists.splice(foundArtistIndex, 1)
        savedArtists.unshift(artist)
      } else {
        savedArtists[foundArtistIndex] = artist
      }
    } else {
      if (atBeggining) {
        savedArtists.unshift(artist)
      } else {
        savedArtists.push(artist)
      }
    }
  })
  artists.value = savedArtists
}

function setArtistQuery() {
  if (route.query.genre) {
    selectedGenre.value = route.query.genre as string
    selectedGenreName.value = capitalizeGenre(selectedGenre.value)
    artistQuery.value = {title: 'Search for Genre', value: 'search-genre'}
    if (route.query.page) {
      const queryPage = parseInt(route.query.page as string)
      maxPageNumber.value = assignGenresMaxPageNumber()
      pageNumber.value = queryPage
      if (queryPage > maxPageNumber.value) {
        pageNumber.value = 1
      }
    }
    else {
      pageNumber.value = 1
      maxPageNumber.value = assignGenresMaxPageNumber()
    }
  }
  else if (route.query.top) {
    const query = artistQueries.find((query: any) => query.value === route.query.top)
    if (query) {
      artistQuery.value = query
    }
  }
  else if (route.query.followed) {
    artistQuery.value = {title: 'Followed Artists', value: 'followed-artists'}
    if (route.query.page) {
      const queryPage = parseInt(route.query.page as string)
      maxPageNumber.value = followedArtistsMaxPageNumber.value
      pageNumber.value = queryPage
      if (queryPage > maxPageNumber.value) {
        pageNumber.value = 1
      }
    }
    else {
      pageNumber.value = 1
      maxPageNumber.value = followedArtistsMaxPageNumber.value
    }
  }
  else {
    artistQuery.value = {title: 'My Top Artists (Short Term - 4 weeks)', value: 'top-short'}
  }
}

function pageNumberChange() {
  //getArtists()
  if (artistQuery.value.value === 'search-genre') {
    router.push({ path: '/artists', query: { genre: selectedGenre.value, page: pageNumber.value }})
  } else if (artistQuery.value.value === 'followed-artists') {
    router.push({ path: '/artists', query: { followed: 'true', page: pageNumber.value }})
  }
}

async function addSelectionToPlaylist() {
  addSelectionLoading.value = true
  if (totalNumberOfSongs.value === 0) {
    router.push({ path: '/'})
    addSelectionLoading.value = false
    return
  }
  await requestsStore.tryRefreshToken()
  await Promise.all(selectedArtists.value.map(async (artist: any) => {
    if (artist.selection.value === 'top-10' && artist.loadedSongs.length === 0) {
      await loadTopTenSongs(artist)
    }
  }))

  playlistSectionsStore.saveArtistSections(selectedArtists.value)
  artists.value.forEach((artist: any) => {
    artist.selected = false
  })
  selectedArtistsStore.selectedArtists = []
  addSelectionLoading.value = false
  $q.notify('Selection Added to Playlist')
  // router.push({ path: '/'})
}

function defaultArtistSelectionChanged() {
  for (const artist of artists.value) {
    if (!selectedArtistIds.value.includes(artist.id)) {
      artist.selection = defaultArtistSelection.value
      if (defaultArtistSelection.value.value === 'top-10') {
        artist.numberOfSongs = defaultNumberOfSongs.value
      } else {
        artist.numberOfSongs = 0
      }
      artist.loadedSongs = []
    }
  }
}

function defaultNumberOfSongsChanged(value: number) {
  defaultNumberOfSongs.value = value
  for (const artist of artists.value) {
    if (!selectedArtistIds.value.includes(artist.id) && artist.selection.value === 'top-10') {
      artist.numberOfSongs = defaultNumberOfSongs.value
    }
  }
}

function artistsQueryChanged() {
  selectedGenre.value = ''
  selectedGenreName.value = ''
  if (artistQuery.value.value === 'search-genre') {
    openGenreDialog()
  }
  else if (artistQuery.value.value === 'followed-artists') {
    router.push({ path: '/artists', query: { followed: 'true' }})
  }
  else {
    router.push({ path: '/artists', query: { top: artistQuery.value.value }})
  }
}

function assignGenresMaxPageNumber(){
  if (genresMaxPageNumber.value[selectedGenre.value]) {
    return genresMaxPageNumber.value[selectedGenre.value]
  }
  return 20 // to give 20 pages to each genre at once...
  //return 1
}

async function searchChanged() {
  if (search.value === '') {
    searchedArtists.value = []
    return
  }
  const url = `https://api.spotify.com/v1/search?q=${search.value}&type=artist&limit=8`
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  searchedArtists.value = response.data.artists.items
  searchShowing.value = true
  searchInput.value.focus()
}

function searchInputClicked() {
  if (search.value !== '') {
    searchShowing.value = true
  }
}

// function saveAutomaticRecommendations(numberOfSongs: number, popularity: number | null) {
//   automaticRecommendationsDialog.value = false
//   router.go(-1)
//   automaticRecommendationsNumberOfSongs.value = numberOfSongs
//   automaticRecommendationsPopularity.value = popularity
// }

function disabledAddSelectionButton() {
  return dialogOpen() || totalNumberOfSongsInPlaylist.value > maxNumberSongsInPlaylist
}

function dialogOpen() {
  return recommendationsDialog.value || genreSelectorDialog.value || catalogDialog.value || relatedArtistsDialog.value || songEditorDialog.value
}

function addDefaultValuesToApiArtists(apiArtists: any[], selected = false) {
  return apiArtists.map((artist: any) => {
    return {
      ...artist,
      numberOfSongs: defaultNumberOfSongsForLoadedArtist(),
      selection: defaultArtistSelection.value,
      loadedSongs: [],
      selected: selected
    }
  })
}

function defaultNumberOfSongsForLoadedArtist(): number {
  if (defaultArtistSelection.value.value === 'top-10') {
    return defaultNumberOfSongs.value
  } else if (defaultArtistSelection.value.value === 'recommendations') {
    return automaticRecommendationsNumberOfSongs.value
  } else if (defaultArtistSelection.value.value === 'latest-release') {
    return 0
  } else if (defaultArtistSelection.value.value === 'browse-catalog') {
    return 0
  } else if (defaultArtistSelection.value.value === 'most-popular') {
    return 0
  } else if (defaultArtistSelection.value.value === 'random') {
    return randomSelectionNumberOfSongs.value
  }
  return 0
}

function clearArtistSelection() {
  const answer = window.confirm(
    'Are you sure you want to clear the selection?'
  )
  if (!answer) return
  artists.value.forEach((artist: any) => {
    artist.selected = false
  })
  selectedArtistsStore.selectedArtists = []
}

function selectRelatedArtists(relatedArtists: any) {
  // const selected = relatedArtists.length === 1
  const selected = relatedArtists.length === 1 && defaultArtistSelection.value.value === 'top-10'
  const relatedArtistsWithDefaultValues = addDefaultValuesToApiArtists(relatedArtists, selected)
  relatedArtistsWithDefaultValues.forEach((artist: any) => {
    addArtistToPage(artist, selected)
  })
  searchShowing.value = false
  if (relatedArtistsDialog.value) {
    router.go(-1)
    relatedArtistsDialog.value = false
  }
  if (selected){
    artistSelected(relatedArtistsWithDefaultValues[0])
  }
  updateSelectedArtistsStore()
}

async function artistSelected(artist: any) {
  if (artist.selection.value === 'top-10' && artist.loadedSongs.length === 0) {
    loadTopTenSongsWithTimeout(artist, 5)
  }
}

function addArtistToPage(artist: any, selected: boolean) {
  const foundArtist = artists.value.find((art: any) => art.id === artist.id)
  if (foundArtist) {
    if (!selectedArtistIds.value.includes(artist.id)) {
      foundArtist.selected = selected
    }
    // pop foundArtist to top of array
    artists.value = artists.value.filter((art: any) => art.id !== artist.id)
    artists.value.unshift(foundArtist)
  }
  else {
    artists.value.unshift(artist)
  }
}

async function searchGenre(genre: string) {
  genreSelectorDialog.value = false
  router.replace({ path: '/artists', query: { genre }})
}

function capitalizeGenre(genre: string): string {
  return genre.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function loadTopTenSongsWithTimeout(artist: any, timeout = 0) {
  artist.numberOfSongs = defaultNumberOfSongsForLoadedArtist()
  setTimeout(() => {
    loadTopTenSongs(artist)
  }, timeout*1000)
}

async function loadTopTenSongs(artist: any) {
  if (artist.selection.value !== 'top-10' || artist.loadedSongs.length > 0) {
    return
  }
  const url = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (!response.cached) {
    data.tracks.forEach((track: any) => {
      const album = { images: track.album.images }
      delete track.album
      track.album = album
      const artists = track.artists.map((artist: any) => {
        return { name: artist.name }
      })
      delete track.artists
      track.artists = artists
      delete track.available_markets
      delete track.disc_number
      delete track.explicit
      delete track.external_ids
      delete track.href
      delete track.is_playable
      delete track.track_number
      delete track.type
      delete track.is_local
    })
  }
  if (shuffleTopTen.value) {
    data.tracks = data.tracks.sort(() => Math.random() - 0.5)
  }
  artist.loadedSongs = data.tracks
  artist.numberOfSongs = Math.min(data.tracks.length, defaultNumberOfSongsForLoadedArtist())
  updateSelectedArtistsStore()
}

// function saveRecommendations(songs: any) {
//   recommendationsDialog.value = false
//   router.back()
//   recommendationsArtist.value.loadedSongs = songs
//   recommendationsArtist.value.numberOfSongs = songs.length
//   updateSelectedArtistsStore()
// }

function confirmArtistSongEditorSelection(songs: any, numberOfSongs: number) {
  songEditorDialog.value = false
  history.back()
  songEdtiorArtist.value.loadedSongs = songs
  songEdtiorArtist.value.numberOfSongs = numberOfSongs
  updateSelectedArtistsStore()
}

function playSong(song: any, playerType: string, context = false) {
  emit('playSong', song, playerType, context)
}

function closePlayer() {
  emit('closePlayer')
}

function openGenreDialog() {
  if (numberOfCols.value === 1) {
    emit('closePlayer')
  }
  window.history.pushState({current: '/'}, '')
  genreSelectorDialog.value = true
}

async function openRelatedArtistsDialog(artist: any) {
  relatedArtistsSelectedArtist.value = artist
  window.history.pushState({current: '/'}, '')
  relatedArtistsDialog.value = true
}

function openCatalogDialog(artist: any) {
  selectedCatalogArtist.value = artist
  window.history.pushState({current: '/'}, '')
  catalogDialog.value = true
}

function openRecommendationsDialog(artist: any) {
  recommendationsArtist.value = artist
  window.history.pushState({current: '/'}, '')
  recommendationsDialog.value = true
}

function openAutomaticRecommendationsDialog() {
  window.history.pushState({current: '/'}, '')
  automaticRecommendationsDialog.value = true
}

async function openSongEditorDialog(artist: any) {
  if (artist.loadedSongs.length === 0 && artist.selection.value === 'top-10') {
    await loadTopTenSongs(artist)
  }
  songEdtiorArtist.value = artist
  window.history.pushState({current: '/'}, '')
  songEditorDialog.value = true
}

function closeAllDialogs() {
  if (genreSelectorDialog.value) {
    emit('closePlayer')
  }
  genreSelectorDialog.value = false
  catalogDialog.value = false
  relatedArtistsDialog.value = false
  recommendationsDialog.value = false
  automaticRecommendationsDialog.value = false
  songEditorDialog.value = false
}

function catalogSelectorSongsSelected(songs: any) {
  //const artist = selectedArtists.value.find((artist: any) => artist.id === selectedCatalogArtist.value.id)
  selectedCatalogArtist.value.loadedSongs = songs.map((song: any) => { return toRaw(song) })
  selectedCatalogArtist.value.numberOfSongs = songs.length
  //selectedCatalogArtist.selectedSongs = songs
  catalogDialog.value = false
  router.go(-1)
  updateSelectedArtistsStore()
}

const totalNumberOfSongs = computed(() => {
  return selectedArtists.value?.map((artist: any) => artist.numberOfSongs).reduce((a: number, b: number) => a + b, 0)
})

const numberSongsInPlaylist = computed(() => {
  return playlistSectionsStore.playlistSongs.length
})

const totalNumberOfSongsInPlaylist = computed(() => {
  return totalNumberOfSongs.value + numberSongsInPlaylist.value
})

function noArtistsText() {
  if (loadingArtists.value) {
    return 'Loading Artists...'
  } else if (shownArtists.value.length === 0) {
    return 'No Artists Found'
  }
}

const artistCardClass = computed(() => {
  return `col-${12/numberOfCols.value}`
})

const artistImageResolution = computed(() => {
  if (numberOfCols.value !== 1) {
    return 'mid-res'
  } else {
    return 'high-res'
  }
})

const menuOptionsClass = computed(() => {
  if (numberOfCols.value === 3) {
    return `col-3 q-pa-md optionsCell` 
  }
  return `col-${12/numberOfCols.value} q-pa-md optionsCell`
})

const menuOptionsClassWithoutPadding = computed(() => {
  if (numberOfCols.value === 3) {
    return `col-3 row optionsCell`
  }
  return `col-${12/numberOfCols.value} row optionsCell`
})

function resizeListener() {
  const width = window.innerWidth
  if (width < 1024) {
    maximizedModals.value = true
  }
  else {
    maximizedModals.value = false
  }
  if (width < 1024) {
    numberOfCols.value = 1
  } else if (width < 1500) {
    numberOfCols.value = 2
  } else if ( width < 1920) {
    numberOfCols.value = 3
  } else {
    numberOfCols.value = 4
  }

  if (width < 1024) {
    showIcon.value = true
  } else {
    showIcon.value = false
  }

  if(width < 440) {
    squeezeArtistImage.value = true
  } else {
    squeezeArtistImage.value = false
  }

  // console.log('width', width)
}
</script>

<style lang="scss">

.body--light {
  /* ... */

  .optionsCell {
    border: 1px solid lightgrey
  }
}

.body--dark {
  /* ... */
  .optionsCell {
    border: 1px solid rgb(48, 48, 48)
  }

  .q-field--dark .q-field__native, .q-field--dark .q-field__prefix, .q-field--dark .q-field__suffix, .q-field--dark .q-field__input {
    color: rgb(235, 235, 235)
  }

  .q-list--dark, .q-item--dark {
    color: rgb(235, 235, 235)
  }

  .greyText {
    color: rgb(235, 235, 235)
  }
}
</style>