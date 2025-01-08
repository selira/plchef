<template>
  <q-layout view="hhh lpR fff">
    <q-header class="bg-info text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title @click="router.push('/')" style="text-overflow: clip;">
            <img
              src="icons/Logo.png"
              style="max-height: 58px; margin-bottom: -9px;"
              class="q-mt-sm"
            />
        </q-toolbar-title>
        <q-separator/>

        <q-btn flat label="Logout" @click="spotifySignOut" class="q-mr-md" v-if="spotifyAuthStore.isLoggedIn && !isMobile" />
        <q-btn flat icon="person" :label="isMobile ? '' : spotifyUsername" class="q-mr-md" v-if="spotifyAuthStore.isLoggedIn">
          <q-menu v-if="isMobile">
            <q-list>
              <q-item clickable @click="spotifySignOut">
                <q-item-section>
                  <q-item-label>Logout</q-item-label>
                  <q-item-label caption>{{ spotifyUsername }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-toggle
          :model-value="$q.dark.isActive"
          @update:model-value="setDarkMode"
          dense
          class="q-mr-sm"
          checked-icon="dark_mode"
          unchecked-icon="light_mode"
          color="black"
        />
        <q-btn dense flat round icon="menu" @click="toggleRightDrawer" v-if="spotifyAuthStore.isLoggedIn"/>

      </q-toolbar>

      <q-tabs
        align="left"
        v-if="spotifyAuthStore.isLoggedIn">
        <q-route-tab to="/" label="Playlist" />
        <q-route-tab to="/artists" label="Artists" />
        <q-route-tab to="/genres" label="Genres"/>
      </q-tabs>
    </q-header>

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered v-if="spotifyAuthStore.isLoggedIn">
      <q-list>
        <div v-for="playlistSection in playlistSections" :key="playlistSection.id">
          <q-item
            clickable
            @click="clickedSection(playlistSection.id)"
            @mouseover="sectionIdHovered = playlistSection.id"
            @mouseleave="sectionIdHovered = -1"
            :class="playlistSection.id === sectionIdHovered || sectionIdClicked === playlistSection.id ? 'lightgrey-blackground' : ''"
          >
            <q-item-section>
              <q-item-label class="tableText">
                {{ truncateString(playlistSection.name, 28) }} {{ playlistSection.selection ? '/' : '' }} {{ playlistSection.selection }}
              </q-item-label>
            </q-item-section>
            <q-item-section avatar side>
              <q-icon
                name="delete"
                class="cursor-pointer"
                @click="deleteSection(playlistSection.id)"
              />
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-page class="column items-center justify-evenly">
        <div v-if="!spotifyAuthStore.isLoggedIn" class="q-pa-sm">
          <div v-if="isMobile">
            <h4>
              Build Spotify Playlists Faster, Discover More Music
            </h4>
            <h5> 
              Explore artists, dive into genres, and add groups of songs to create playlists with ease—your way, every time.
            </h5>
          </div>
          <div v-else>
            <h3>
              Build Spotify Playlists Faster, Discover More Music
            </h3>
            <h4> 
              Explore artists, dive into genres, and add groups of songs to create playlists with ease—your way, every time.
            </h4>
          </div>
        </div>
        <div v-if="!spotifyAuthStore.isLoggedIn" class="q-mb-lg">
          <q-btn color="secondary" push @click="router.push('login')" size="lg" no-caps>
            <div class="row items-center no-wrap">
              <q-icon
                name="img:icons/Spotify_Icon_RGB_Black.png"
                size="md"
                class='q-mr-md'
              />
              <div class="text-center">
                Login with Spotify
              </div>
            </div>
          </q-btn>
        </div>
        <div v-if="!spotifyAuthStore.isLoggedIn" class="col">
          <p class="q-ma-none q-pa-none">Demo:</p>
          <iframe
            :width="isMobile ? 300 : 560" :height="isMobile ? 200 : 316" src="https://www.youtube.com/embed/W4AZOf0nGqU?si=19PSHzOlvCgLD_9h" 
            title="YouTube video player" frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen
          >
          </iframe>
          
        </div>
        <div v-if="spotifyAuthStore.isLoggedIn" class="q-pa-md">
          <div class="row justify-between">
            <div class="col-3">
              <q-btn
                color="positive"
                @click="goToArtistsPage"
                icon="add"
                label="Artists"
              ></q-btn>
            </div>
            <div class="col-8">
              <q-input
                v-model="playlistName"
                label="Playlist Name"
                dense
                maxlength="100"
                clearable
              >
              </q-input>
            </div>
          </div>
          
          <br>

          <div :class="buttonsClass()">
            <q-btn
              color="primary"
              @click="createPlaylist()"
              class="q-mx-xs q-mb-sm"
              style="min-width: 150px;"
              :loading="createPlaylistLoading"
              :disable="selectedSongs.length === 0 || playlistName === ''"
              :dense="isMobile"
            >Export Playlist</q-btn>
            <q-btn
              color="dark"
              @click="clearPlaylist()"
              class="q-mx-xs q-mb-sm"
              style="min-width: 150px;"
              :dense="isMobile"
            >Clear Playlist</q-btn>
            <q-btn
              color="purple"
              @click="shuffleSongs()"
              class="q-mx-xs q-mb-sm"
              style="min-width: 150px;"
              :dense="isMobile"
            >Shuffle</q-btn>
            <q-btn
              color="cyan"
              @click="specialShuffle()"
              class="q-mx-xs q-mb-sm"
              style="min-width: 150px;"
              :dense="isMobile"
            >Special Shuffle
              <q-tooltip>
                Shuffle alternating between sections.
              </q-tooltip>
            </q-btn>
          </div>

          <div :class="addToPlaylistClass()">
            <div class="q-pa-xs">
              <q-select
                filled
                v-model="playlist"
                :options="playlists"
                :loading="loadingMorePlaylists"
                @virtual-scroll="scrollingPlaylistOptions"
                :style="isMobile ? 'max-width: 160px' : 'min-width: 300px'"
              />
            </div>
            <div class="q-pa-xs">
              <q-btn
                color="primary"
                @click="addToUserPlaylist()"
                style="min-width: 150px;"
                :disable="selectedSongs.length === 0 || playlist.value === '0'"
                :loading="addToPlaylistLoading"
              >Add to Playlist</q-btn>
            </div>
          </div>

          <br>

          <div class="col">
            Songs: {{ totalNumberOfSongs }} / 1000
          </div>

          <div style="max-width: 91vw;">
            <q-table
              :rows="selectedSongs" 
              :columns="isMobile ? mobileColumns : columns" 
              row-key="id"
              :pagination="{ rowsPerPage: 0 }" 
              style="height: 60vh;"
              class="tableText"
              hide-bottom
              virtual-scroll
              dense
              scroll
            >
              <template v-slot:body="props">
                <q-tr :props="props" :class="{ 'lightgrey-blackground': props.row.sectionId === sectionIdClicked || props.row.sectionId === sectionIdHovered }">
                  <q-td key="index" :props="props" v-if="!isMobile">
                    {{ props.rowIndex + 1 }}
                  </q-td>
                  <q-td key="name" :props="props">
                    {{ props.row.name }}
                    <q-tooltip v-if="!isMobile ? props.row.artist.length > 30 : props.row.artist.length > 15">
                      {{ props.row.name }}
                    </q-tooltip>
                  </q-td>
                  <!-- <q-tootlip v-if="props.row.artist.length > 30"> -->
                  <q-td key="artist" :props="props">
                    {{ props.row.artist }}
                    <q-tooltip v-if="!isMobile ? props.row.artist.length > 30 : props.row.artist.length > 15">
                      {{ props.row.artist }}
                    </q-tooltip>
                  </q-td>
                  <q-td key="duration" :props="props" v-if="props.row.duration && !isMobile">
                    {{ toMinuteSecond(props.row.duration) }}
                  </q-td>
                  <q-td key="options" :props="props">
                    <q-btn
                        size="xs"
                        flat
                        round
                        dense
                        icon="more_vert"
                        @click.stop
                      >
                        <q-menu>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(props.row.uri)"
                              v-close-popup
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="delete"
                              clickable
                              @click="removeSong(props.row.id)"
                              v-close-popup
                            >
                              <q-item-section>Remove Song</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
          <div>
            <div>
              <q-menu v-model="searchShowing" no-focus>
                <q-list
                  v-if="search !== ''"
                  bordered
                  separator
                  dense
                >
                  <q-item
                    v-for="song in searchedSongs"
                    :key="song.id"
                    clickable
                    @click="addSearchedSongToPlaylist(song)"
                  >
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name + ' - ' + song?.artists[0].name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
            <div>
              <q-input
                v-model="search"
                filled
                debounce="500"
                placeholder="Add song"
                @update:model-value="searchChanged"
                ref="searchInput"
                @click="searchInputClicked"
                style="max-width: 300px;"
                :disable="selectedSongs.length >= 1000"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
          </div>

          <div v-if="playlistUrl">
            <a :href="playlistUrl" target="_blank">Playlist Link to Web App</a>
          </div>
          <div v-if="playlistURI">
            <a :href="playlistURI" target="_blank">Playlist Link to App</a>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <q-footer class="text-white" >
      <q-toolbar>
        <q-toolbar-title>
          <img
            src="icons/Logo.png"
            style="max-height: 50px;"
            class="q-mt-sm"
          >
        </q-toolbar-title>
        <div class="row justify-between">
          <div class="column text-grey-0 q-mr-md">
            <a
              href='https://github.com/selira/plchef' 
              target="_blank"
              v-if="!isMobile"
            >
              <q-btn
                flat
                dense
                no-caps
                color="white"
                label="Github"
                class="q-mt-sm"
              />
            </a>
            <a
              href='https://docs.google.com/forms/d/e/1FAIpQLSeGgHcVQB1GinBAzR65c5WtfkjDkKLbZ6ORGCgu5zftnT6uKA/viewform?usp=sf_link' 
              target="_blank"
              v-if="!isMobile"
            >
              <q-btn
                flat
                dense
                no-caps
                color="white"
                label="Feedback/Contact"
              />
            </a>
          </div>
          <div class="column text-grey-0">
            <a
              href='https://github.com/selira/plchef' 
              target="_blank"
              v-if="isMobile"
            >
              <q-btn
                flat
                dense
                no-caps
                color="white"
                label="Github"
                class="q-mt-sm"
              />
            </a>
            <a
              href='https://docs.google.com/forms/d/e/1FAIpQLSeGgHcVQB1GinBAzR65c5WtfkjDkKLbZ6ORGCgu5zftnT6uKA/viewform?usp=sf_link' 
              target="_blank"
              v-if="isMobile"
            >
              <q-btn
                flat
                dense
                no-caps
                color="white"
                label="Feedback/Contact"
              />
            </a>
            <q-btn
              flat
              dense
              no-caps
              color="white"
              label="Terms of Service"
              @click="router.push('/terms-of-service')"
              :class="{'q-mt-sm': !isMobile}"
            />
            <q-btn
              flat
              dense
              no-caps
              color="white"
              label="Privacy Policy"
              @click="router.push('/privacy-policy')"
            />
          </div>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeMount, nextTick, onUnmounted } from 'vue'
import { usePlaylistSectionsStore } from '../stores/playlist-sections'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { useLocalStorageStore } from '../stores/local-storage'
import { useRouter } from 'vue-router'
import { useQuasar, QTableProps } from 'quasar'
import { spotifyImage } from '../functions/utils'

const $q = useQuasar()
 
const spotifyAuthStore = useSpotifyAuthStore()
const playlistSectionsStore = usePlaylistSectionsStore()
const localStorageStore = useLocalStorageStore()
const requestsStore = useSpotifyRequests()
const router = useRouter()

const isMobile = ref(false)

const loading = ref(false)
const createPlaylistLoading = ref(false)
const loadingMorePlaylists = ref(false)
const addToPlaylistLoading = ref(false)

const playlistSections = ref([]) as any
const rightDrawerOpen = ref(false)

const playlistName = ref('')
const selectedSongs = ref([]) as any

const playlistUrl = ref('')
const playlistURI = ref('')

const spotifyUsername = ref('')
const spotifyId = ref('')

const sectionIdClicked = ref(-1)
const sectionIdHovered = ref(-1)

const search = ref('')
const searchedSongs = ref([]) as any
const searchShowing = ref(false)
const searchInput = ref(null) as any

const playlist = ref({label: 'Select a Playlist', value: '0'}) as any
const playlists = ref([{label: 'Select a Playlist', value: '0'}]) as any
const nextPage = ref(1)
const notMorePlaylists = ref(false)

const columns: QTableProps['columns'] = [
  {
    name: 'index',
    label: '#',
    field: 'index',
    align: 'left',
    style: 'max-width: 46px; width: 46px;'
  },
  {
    name: 'name',
    // required: true,
    label: 'Title',
    align: 'left',
    field: 'name',
    style: 'max-width: 250px; width: 250px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;'
  },
  {
    name: 'artist',
    // required: true,
    label: 'Artist',
    align: 'left',
    field: 'artist',
    style: 'max-width: 220px; width: 220px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;'
  },
  {
    name: 'duration',
    label: 'Duration',
    field: 'duration_ms',
    align: 'right'
    // format: (val: number) => toMinuteSecond(val)
  },
  {
    name: 'options',
    label: '',
    field: 'options'
  }
]

const mobileColumns: QTableProps['columns'] = [
  {
    name: 'name',
    // required: true,
    label: 'Title',
    align: 'left',
    field: 'name',
    style: 'max-width: 40vw; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;'
  },
  {
    name: 'artist',
    // required: true,
    label: 'Artist',
    align: 'left',
    field: 'artist',
    style: 'max-width: 30vw; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;'
  },
  {
    name: 'options',
    label: '',
    field: 'options',
    style: 'max-width: 10vw'
  }
]

function toggleRightDrawer () {
  rightDrawerOpen.value = !rightDrawerOpen.value
  localStorageStore.sectionsVisible = rightDrawerOpen.value
}

onBeforeMount(async () => {
  playlistSections.value = playlistSectionsStore.playlistSections
  playlistName.value = 'PLChef Playlist (' + new Date().toDateString() + ')'
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  window.addEventListener("resize", resizeListener)
  resizeListener()
  if (code) {
    await spotifyAuthStore.afterLoginCallback()
  }
  if (spotifyAuthStore.isLoggedIn) {
    await loadSpotifyId()
    await loadPlaylists()
    selectedSongs.value = playlistSectionsStore.playlistSongs
  }
})

onUnmounted(() => {
  window.removeEventListener("resize", resizeListener)
})

async function spotifySignOut() {
  spotifyAuthStore.logout()
  playlistSectionsStore.clearPlaylist()
  window.location.reload()
}

function searchInputClicked() {
  if (search.value !== '') {
    searchShowing.value = true
  }
}

async function loadSpotifyId() {
  const url = 'https://api.spotify.com/v1/me'
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    if (response.status === 403) {
      spotifySignOut()
    }
    return
  }
  spotifyUsername.value = response.data.display_name
  spotifyId.value = response.data.id
}

function clearPlaylist() {
  const answer = window.confirm(
    'Are you sure you want to clear the playlist?'
  )
  if (!answer) return
  playlistSectionsStore.clearPlaylist()
  selectedSongs.value = []
  playlistSections.value = []
  playlistURI.value = ''
  playlistUrl.value = ''
}

function truncateString(str: string, num = 35) {
  if (str.length <= num) {
    return str
  }
  return str.slice(0, num) + '...'
}

function setDarkMode(mode: boolean) {
  $q.dark.set(mode)
  localStorageStore.darkMode = mode
}

watch(selectedSongs, (newVal) => {
  playlistSectionsStore.playlistSongs = newVal
})

function goToArtistsPage() {
  router.push('/artists')
}

function toMinuteSecond(miliseconds: number) {
  const minutes = Math.floor(miliseconds / 60000)
  const seconds = ((miliseconds % 60000) / 1000).toFixed(0)
  return minutes + ':' + (parseInt(seconds) < 10 ? '0' : '') + seconds
}

async function createPlaylist() {
  createPlaylistLoading.value = true
  const getUserProfileUrl = 'https://api.spotify.com/v1/me'
  const response1 = await requestsStore.getRequest(getUserProfileUrl)
  if (response1.status !== 200) {
    createPlaylistLoading.value = false
    return
  }
  const user_id = response1.data.id

  const createPlaylistUrl = `https://api.spotify.com/v1/users/${user_id}/playlists`
  const createPlaylistBody = {
    name: playlistName.value,
    description: 'Songs from: ' + sectionNames(),
  }
  const response = await requestsStore.postRequest(createPlaylistUrl, createPlaylistBody)
  if (response.status !== 201 && response.status !== 200) {
    createPlaylistLoading.value = false
    return
  }

  const playlist_id = response.data.id
  await loadTracksToPlaylist(playlist_id)
  playlistUrl.value = response.data.external_urls.spotify
  playlistURI.value = response.data.uri
  alert('Playlist created!')
  createPlaylistLoading.value = false
}

async function loadTracksToPlaylist(playlistId: string){
  const tracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
  const trackUrisInChunksof100 = []
  for (let i = 0; i < Math.min(songUris.value.length, 1000); i += 100) {
    trackUrisInChunksof100.push(songUris.value.slice(i, i + 100))
  }
  for (const trackUris of trackUrisInChunksof100) {
    const tracksBody = {
      uris: trackUris
    }
    const response2 = await requestsStore.postRequest(tracksUrl, tracksBody)
    if (response2.status !== 201 && response2.status !== 200) {
      createPlaylistLoading.value = false
      return
    }
    //sleep for 1 second to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000))
  }
}

function shuffleSongs() {
  selectedSongs.value = shuffle([...selectedSongs.value])
}

function shuffle(array: any) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function specialShuffle() {
  const songsPerSection = {} as any
  const result = []
  const playlistSectionIds = playlistSections.value.map((section: any) => section.id).sort(() => Math.random() - 0.5)
  playlistSectionIds.forEach((sectionId: any) => {
    songsPerSection[sectionId] = selectedSongs.value.filter((song: any) => song.sectionId === sectionId).sort(() => Math.random() - 0.5)
  })
  while (Object.keys(songsPerSection).length > 0) {
    for (const sectionId of playlistSectionIds) {
      if (songsPerSection[sectionId] !== undefined && songsPerSection[sectionId]?.length > 0 ) {
        result.push(songsPerSection[sectionId].pop())
      } else {
        delete songsPerSection[sectionId]
      }
    }
  }
  selectedSongs.value = result
}

function sectionNames() {
  return playlistSections.value.map((section: any) => {
    if (section.selection === 'Recommended songs based on artist') {
      return section.name + ' (Recs)'
    }
    return section.name
  }).join(', ').slice(0, 280)
}

function scrollingPlaylistOptions({ to, ref }: any) {
  const lastIndex = playlists.value.length - 1

  if (loadingMorePlaylists.value !== true && to === lastIndex && !notMorePlaylists.value) {
    loadingMorePlaylists.value = true
    setTimeout(() => {
      nextTick(() => {
        loadPlaylists()
        ref.refresh()
        loadingMorePlaylists.value = false
      })
    }, 500)
  }
}

async function loadPlaylists() {
  if (loading.value) return
  loading.value = true
  const url = `https://api.spotify.com/v1/me/playlists?limit=50&offset=${(nextPage.value - 1) * 50}`
  //const url = `https://api.spotify.comv1/users/${spotifyId.value}/playlists?limit=50&offset=${(nextPage.value - 1) * 50}`
  requestsStore.getRequest(url).then((response) => {
    if (response.status !== 200) {
      loading.value = false
      return
    }
    const ownedPlaylists = response.data.items.filter((playlist: any) => playlist?.owner?.id === spotifyId.value).map((playlist: any) => {
      return {
        label: playlist?.name,
        value: playlist?.id
      }
    })
    playlists.value = playlists.value.concat(ownedPlaylists)
    loading.value = false
    notMorePlaylists.value = response.data.items.length < 50
    nextPage.value++
  })
}

async function addToUserPlaylist() {
  addToPlaylistLoading.value = true
  const playlistId = playlist.value.value
  await loadTracksToPlaylist(playlistId)
  alert('Songs added to: ' + playlist.value.label + '!')
  addToPlaylistLoading.value = false
}

function openTrackSpotifyAppLink(uri: string) {
  window.open(uri, '_blank')
}

function removeSong(songId: string) {
  selectedSongs.value = selectedSongs.value.filter((song: any) => song.id !== songId)
}

//map selected songs to their uris
const songUris = computed(() => {
  return selectedSongs.value.map((song: any) => {
    return song.uri
  })
})

const totalNumberOfSongs = computed(() => {
  return selectedSongs.value.length
})

// async function request() {
//   const url = `https://api.spotify.com/v1/me`
//   const response = await requestsStore.getRequest(url)
//   console.log(response.data)
// }

async function searchChanged() {
  if (search.value === '') {
    searchedSongs.value = []
    return
  }
  const url = `https://api.spotify.com/v1/search?q=${search.value}&type=track&limit=${isMobile.value ? 3 : 8}`
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  searchedSongs.value = response.data.tracks.items
  searchShowing.value = true
  searchInput.value.focus()
}

async function addSearchedSongToPlaylist(song: any) {
  playlistSectionsStore.addSingleTrack(song, 'Songs added from search')
  search.value = ''
  searchedSongs.value = []
  searchShowing.value = false
}

function clickedSection(sectionId: number) {
  if (sectionId === sectionIdClicked.value) {
    sectionIdClicked.value = -1
    return
  }
  sectionIdClicked.value = sectionId
}

function deleteSection(sectionId: number) {
  const answer = window.confirm(
    'Are you sure you want to delete this section?'
  )
  if (!answer) return
  selectedSongs.value = selectedSongs.value.filter((song: any) => song.sectionId !== sectionId)
  playlistSectionsStore.removeSection(sectionId)
  sectionIdClicked.value = -1
}

function buttonsClass() {
  if (isMobile.value) {
    return 'row items-center justify-evenly'
  }
  return 'items-center justify-evenly row wrap'
}

function addToPlaylistClass() {
  if (isMobile.value) {
    return 'row items-center justify-evenly'
  }
  return 'items-center row wrap justify-evenly'
}

function resizeListener() {
  const width = window.innerWidth
  if (width < 1024) {
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

</script>

<style>
.body--light {
  /* ... */
  background-color: #f5f5f5;
  .lightgrey-blackground {
    background-color: lightgrey;
  }

  .tableText {
    color: black;
  }
}

.body--dark {
  /* ... */
  .tableText {
    color: rgb(220, 220, 220);
  }

  .lightgrey-blackground {
    background-color: rgb(52, 62, 75);
  }
}
</style>