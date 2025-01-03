<template>
  <q-card>
    <div style="display: flex; flex-direction: column; height: 100%;">
    <div class="row" style="min-height: 0px; flex: 1 1 auto; overflow-y: auto;" >
      <div :class="[oneColumn ? 'col-12' : 'col-4']">
        <div class="row">
          <div class="col-12">
            <q-card>
              <q-card-section>
                <div class="row">
                  <div class="col-2">
                    <q-img
                      :src="imageUrl(props.artist, 2)"
                      height="50px" 
                      fit="contain"
                    ></q-img>
                  </div>
                  <div class="col-10">
                    <q-item style="min-width: 0;">
                      <q-item-section>
                        <q-item-label> <div class="ellipsis">{{ artist.name }}</div></q-item-label>
                        <q-item-label >Songs Selected: {{ selectedSongs.length }} / {{ maxNumberofSongs }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <q-tabs v-model="tab" align="justify" class="text-primary">
          <q-tab name="album" label="Albums"></q-tab>
          <q-tab name="single" label="Singles"></q-tab>
          <q-tab name="compilation" label="Compilations"></q-tab>
        </q-tabs>
        <q-separator />
        <q-tab-panels
          v-model="tab"
          animated
          style="height: 65vh;"
          @before-transition="beforeTransition"
        >
          <q-tab-panel name="album">
            <div class="row">
              <div class="col-4">
                <q-select
                  v-model="sortOption"
                  :options="sortOptions"
                  label="Sort by"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('album')"
                  :disable="albums['album'] === undefined || albums['album'].length === 0"
                />
              </div>
              <div class="col-4">
                <q-select
                  v-model="descending"
                  :options="[{label: 'Descending', value: true}, {label: 'Ascending', value: false}]"
                  label="Order"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('album')"
                  :disable="albums['album'] === undefined || albums['album'].length === 0"
                />
              </div>
              <div class="col-4">
                <div class="row">
                  <q-btn
                    color="primary" 
                    :label="!allAlbumsSelected['album'] ? 'Select All' : 'Undo' " 
                    @click="selectAllAlbums('album')" 
                    size="md"
                    :loading="selectAllAlbumsLoading"
                    style="margin-left: auto"
                    :disable="albums['album'] === undefined || albums['album'].length === 0"
                  />
                </div>
              </div>
            </div>
            <q-infinite-scroll @load="loadMoreAlbums" :offset="250" v-if="albums['album']">
              <q-list bordered>
                <q-item
                  v-for="album in albumAlbums"
                  :key="album.id" 
                  clickable
                  @click="selectAlbum(album)"
                  :active="selectedAlbum.id === album.id"
                  :class="songsSelected(album)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      v-model="album.selected"
                      @update:model-value="albumCheckboxSelected(album)"
                      :disable="loadingCheckbox"
                    />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-img :src="imageUrl(album, 2)"></q-img>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ album.name }}</q-item-label>
                    <q-item-label caption>Popularity: {{ album.popularity }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>{{ album.release_date.split('-')[0] }}</q-item-section>
                </q-item>
              </q-list>
              <template v-slot:loading v-if="showLoader('album')">
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </template>
            </q-infinite-scroll>
            <div v-if="showInitialLoader('album') && albumsExist">
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </div>
            <div v-if="!albumsExist">
              <div class="row justify-center q-my-md">
                <q-icon name="sentiment_very_dissatisfied" size="40px" color="primary" />
              </div>
              <div class="row justify-center q-my-md">
                <h5>No albums found</h5>
              </div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="single">
            <div class="row">
              <div class="col-4">
                <q-select
                  v-model="sortOption"
                  :options="sortOptions"
                  label="Sort by"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('single')"
                  :disable="albums['single'] === undefined || albums['single'].length === 0"
                />
              </div>
              <div class="col-4">
                <q-select
                  v-model="descending"
                  :options="[{label: 'Descending', value: true}, {label: 'Ascending', value: false}]"
                  label="Order"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('single')"
                  :disable="albums['single'] === undefined || albums['single'].length === 0"
                />
              </div>
              <div class="col-4">
                <div class="row">
                  <q-btn
                    color="primary" 
                    :label="!allAlbumsSelected['single'] ? 'Select All' : 'Undo' " 
                    @click="selectAllAlbums('single')" 
                    size="md"
                    :loading="selectAllAlbumsLoading"
                    style="margin-left: auto"
                    :disable="albums['single'] === undefined || albums['single'].length === 0"
                  />
                </div>
              </div>
            </div>
            <q-infinite-scroll @load="loadMoreSingles" :offset="250" v-if="albums['single']">
              <q-list bordered>
                <q-item
                  v-for="album in singleAlbums"
                  :key="album.id" 
                  clickable
                  @click="selectAlbum(album)"
                  :active="selectedAlbum.id === album.id"
                  :class="songsSelected(album)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      v-model="album.selected"
                      @update:model-value="albumCheckboxSelected(album)"
                    />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-img :src="imageUrl(album, 2)"></q-img>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ album.name }}</q-item-label>
                    <q-item-label caption>Popularity: {{ album.popularity }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>{{ album.release_date.split('-')[0] }}</q-item-section>
                </q-item>
              </q-list>
              <template v-slot:loading v-if="showLoader('single')">
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </template>
            </q-infinite-scroll>
            <div v-if="showInitialLoader('single') && singlesExist">
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
              </div>
            </div>
            <div v-if="!singlesExist">
              <div class="row justify-center q-my-md">
                <q-icon name="sentiment_very_dissatisfied" size="40px" color="primary" />
              </div>
              <div class="row justify-center q-my-md">
                <h5>No singles found</h5>
              </div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="compilation">
            <div class="row">
              <div class="col-4">
                <q-select
                  v-model="sortOption"
                  :options="sortOptions"
                  label="Sort by"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('compilation')"
                  :disable="albums['compilation'] === undefined || albums['compilation'].length === 0"
                />
              </div>
              <div class="col-4">
                <q-select
                  v-model="descending"
                  :options="[{label: 'Descending', value: true}, {label: 'Ascending', value: false}]"
                  label="Order"
                  dense
                  outlined
                  emit-value
                  map-options
                  @update:model-value="sortAlbums('compilation')"
                  :disable="albums['compilation'] === undefined || albums['compilation'].length === 0"
                />
              </div>
              <div class="col-4">
                <div class="row">
                  <q-btn
                    color="primary" 
                    :label="!allAlbumsSelected['compilation'] ? 'Select All' : 'Undo' " 
                    @click="selectAllAlbums('compilation')" 
                    size="md"
                    :loading="selectAllAlbumsLoading"
                    style="margin-left: auto"
                    :disable="albums['compilation'] === undefined || albums['compilation'].length === 0"
                  />
                </div>
              </div>
            </div>
            <q-infinite-scroll @load="loadMoreCompilations" :offset="250" v-if="albums['compilation']">
              <q-list bordered>
                <q-item
                  v-for="album in compilationAlbums"
                  :key="album.id" 
                  clickable
                  @click="selectAlbum(album)"
                  :active="selectedAlbum.id === album.id"
                  :class="songsSelected(album)"
                >
                  <q-item-section avatar>
                    <q-checkbox
                      v-model="album.selected"
                      @update:model-value="albumCheckboxSelected(album)"
                    />
                  </q-item-section>
                  <q-item-section avatar>
                    <q-img :src="imageUrl(album, 2)"></q-img>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ album.name }}</q-item-label>
                    <q-item-label caption>Popularity: {{ album.popularity }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>{{ album.release_date.split('-')[0] }}</q-item-section>
                </q-item>
              </q-list>
              <template v-slot:loading v-if="showLoader('compilation')">
                <div class="row justify-center q-my-md">
                  <q-spinner-dots color="primary" size="40px" />
                </div>
              </template>
            </q-infinite-scroll>
            <div v-if="showInitialLoader('compilation') && compilationsExist">
              <div class="row justify-center q-my-md">
                <q-spinner-dots color="primary" size="40px" />
              </div>
            </div>
            <div v-if="!compilationsExist">
              <div class="row justify-center q-my-md">
                <q-icon name="sentiment_very_dissatisfied" size="40px" color="primary" />
              </div>
              <div class="row justify-center q-my-md">
                <h5>No compilations found</h5>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
      <div :class="[oneColumn ? 'col-12' : 'col-8']" v-if="!isEmpty(selectedAlbum)">
        <q-card>
          <q-card-section>
            <div class="row">
              <div class="col-2">
                <q-img
                  :src="imageUrl(selectedAlbum)"
                  height="100px" 
                  fit="contain"
                ></q-img>
              </div>
              <div class="col-8 greyText">
                <h5>{{ selectedAlbum.name }} ({{ selectedAlbum.release_date }})</h5>
              </div>
              <div class="col-2">
                <q-icon
                  :name="$q.dark.isActive ? 'img:icons/Spotify_Icon_RGB_Green.png' : 'img:icons/Spotify_Icon_RGB_Black.png'"
                  class="q-mt-sm q-ml-md"
                  color="black"
                  size="md"
                  style="cursor: pointer;"
                  @click.stop
                >
                  <q-menu class="z-max">
                    <q-list>
                      <q-item
                        key="spotify-app-link"
                        clickable
                        @click="openSpotifyAppLink(selectedAlbum)"
                      >
                        <q-item-section>Open Spotify</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-icon>
              </div>
              
            </div>
          </q-card-section>
          <q-separator></q-separator>
          <q-table
            :rows="albumSongs"
            :columns="columns"
            row-key="id"
            selection="multiple"
            v-model:selected="selectedSongs"
            :pagination="{ rowsPerPage: 0 }"
            hide-bottom
            scroll
            style="height: 60vh"
            dense
            separator="none"
            @update:selected="onSelectionUpdate"
          >
            <template v-slot:body="props">
              <q-tr :props="props" @click="onRowClick(props.row)" class ="">
                <q-td class="">
                  <q-checkbox v-model="props.selected" class="q-checkbox--dense text-dark" :disable="!props.selected && (selectedSongs.length >= maxNumberofSongs)" />
                </q-td>
                <q-td>
                  <q-icon name="play_circle" class="cursor-pointer" @click.stop="playSong(props.row)" size="sm" v-if="spotifyAuthStore.isPremium">
                  <!-- <q-icon name="play_circle" size="sm"> -->

                    <!-- <q-tooltip>Play Preview Clip</q-tooltip> -->
                  </q-icon>
                </q-td>
                <q-td key="name" :props="props" class="greyText">
                  {{ props.row.name }}
                </q-td>
                <q-td key="duration" :props="props" class ="">
                  {{ toMinuteSecond(props.row.duration_ms) }}
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <q-card-actions :class="{'q-ml-sm': !oneColumn}">
          <q-btn @click="saveSelection" color="primary">Save Selection</q-btn>
          <q-btn @click="closeDialog" color="negative">Cancel</q-btn>
        </q-card-actions>
      </div>
    </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { QTableProps, useQuasar } from 'quasar'

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'selectSongs', selection: any): void
  (e: 'playSong', song: any, playerType: string): void
}>()

const $q = useQuasar()

const props = defineProps<{ artist: any, maxNumberofSongs: number, oneColumn: boolean }>()

const requestsStore = useSpotifyRequests()
const spotifyAuthStore = useSpotifyAuthStore()
const market = spotifyAuthStore.market || 'US'

const selectedAlbum = ref({}) as any
const selectedSongs = ref([]) as any
const savedSongs = ref([]) as any
const albumSongs = ref([]) as any
const albums = ref({}) as any
const nextUrls = ref({}) as any
const tab = ref('album') as any
const selectAllAlbumsLoading = ref(false)
const loadingCheckbox = ref(false)
const allAlbumsSelected = ref({
  album: false,
  single: false,
  compilation: false
}) as any


const sortOption = ref("release_date")
const sortOptions = [
  {
    label: 'Date',
    value: 'release_date'
  },
  {
    label: 'Popularity',
    value: 'popularity'
  }
]

const albumsExist = ref(true)
const singlesExist = ref(true)
const compilationsExist = ref(true)
const descending = ref(true)

const columns: QTableProps['columns'] = [
  {
    name: 'play',
    label: '',
    field: 'play',
    align: 'left',
    format: (val: any) => {
      return val
    }
  },
  {
    name: 'name',
    label: 'Name',
    field: 'name',
    align: 'left',
  },
  {
    name: 'duration',
    label: 'Duration',
    field: 'duration_ms',
    align: 'right'
    // format: (val: number) => toMinuteSecond(val)
  }
]

onMounted(async () => {
  // make a clone of props.artist.selectedSongs to avoid mutating the prop
  props.artist.loadedSongs.forEach((song: any) => {
    selectedSongs.value.push(song)
  })
  await loadAlbums('album')
})

function checkAllAlbumsSelected(group: string) {
  albums.value[group]?.forEach((album: any) => {
    album.selected = checkIfSelected(album)
  })
}

function checkIfSelected(album: any) {
  const nsongs = selectedSongs.value.filter((song: any) => song.album.id === album.id)
  if (nsongs.length === album.tracks.items.length) {
    return true
  } else if (nsongs.length === 0) {
    return false
  } else {
    return null
  }
}

function saveSelection() {
  emit('selectSongs', selectedSongs.value)
}

async function loadAlbums(group: string) {
  //group can be album, single or compilation
  const artist = props.artist
  const url = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=${group}&limit=40&` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (data.items.length === 0) {
    if (group === 'album') {
      albumsExist.value = false
    } else if (group === 'single') {
      singlesExist.value = false
    } else if (group === 'compilation') {
      compilationsExist.value = false
    }
    return
  }
  const albumsWithPopularity = await loadAlbumsPopularity40(data.items)
  albums.value[group] = albumsWithPopularity
  nextUrls.value[group] = data.next
  sortAlbums(group)
  checkAllAlbumsSelected(group)
}

async function loadAlbumsPopularity40(albums: any) {
  const first20Albums = albums.slice(0, 20)
  const second20Albums = albums.slice(20, 40)
  if (second20Albums.length === 0) {
    return await loadAlbumsPopularity(first20Albums)
  } else {
    await requestsStore.tryRefreshToken()
    return await Promise.all([
      loadAlbumsPopularity(first20Albums),
      loadAlbumsPopularity(second20Albums)
    ]
    ).then((values) => {
      return values[0].concat(values[1])
    })
  }
}

async function loadAlbumsPopularity(albums: any) {
  const ids = albums.map((album: any) => album.id)
  const url = `https://api.spotify.com/v1/albums?ids=${ids.join(',')}&` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  if (response.cached) {
    return response.data.albums
  }
  response.data.albums.forEach((album: any) => {
    delete album.album_type
    delete album.total_tracks
    delete album.available_markets
    delete album.href
    delete album.release_date_precision
    delete album.type
    delete album.artists
    delete album.copyrights
    delete album.external_ids
    delete album.genres
    delete album.label
    album.selected = false
    album.tracks.items.forEach((song: any) => {
      delete song.available_markets
      delete song.disc_number
      delete song.explicit
      delete song.href
      delete song.is_local
      delete song.track_number
      delete song.type
      delete song.is_playable
      song.album = { id: album.id, images: album.images }
      song.artists.forEach((artist: any) => {
        delete artist.external_urls
        delete artist.href
        delete artist.type
        delete artist.uri
      })
    })
  })
  return response.data.albums
}

async function selectAlbum(album: any) {
  selectedAlbum.value = album
  albumSongs.value = assignAlbumToSongs(album.tracks.items, album)
  if (album.tracks.next !== null) {
    await loadMoreAlbumSongs(album)
  }
}

async function albumCheckboxSelected(album: any) {
  loadingCheckbox.value = true
  try {
    await selectAlbum(album)
    if (album.selected) {
      selectAllAlbumSongs()
    } else {
      selectedSongs.value = selectedSongs.value.filter((song: any) => song.album.id !== album.id)
    }
  } finally {
    loadingCheckbox.value = false
  }
}

function closeDialog() {
  emit('closeDialog')
}

function playSong(song: any) {
  emit('playSong', song, props.oneColumn ? 'none' : 'normal')
}

async function beforeTransition(group: any) {
  if (albums.value[group] === undefined) {
    await loadAlbums(group)
  }
  allAlbumsSelected.value[group] = false
}

async function loadMoreAlbums(index: number, done: () => void) {
  await loadMoreGroup('album', done)
}

async function loadMoreSingles(index: number, done: () => void) {
  await loadMoreGroup('single', done)
}

async function loadMoreCompilations(index: number, done: () => void) {
  await loadMoreGroup('compilation', done)
}

async function loadMoreGroup(group: string, done: () => void) {
  if (nextUrls.value[group] === null || nextUrls.value[group] === undefined) {
    return
  }
  const url = nextUrls.value[group]
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (data.items.length === 0) {
    done()
    return
  }
  const albumsWithPopularity = await loadAlbumsPopularity40(data.items)
  albums.value[group] = albums.value[group].concat(albumsWithPopularity)
  nextUrls.value[group] = data.next
  sortAlbums(group)
  checkAllAlbumsSelected(group)
  done()
}

// async function loadAllGroup(group: string) {
//   if (nextUrls.value[group] === null || nextUrls.value[group] === undefined) {
//     return
//   }
//   const url = nextUrls.value[group]
//   const response = await requestsStore.getRequest(url)
//   if (response.status !== 200) {
//     return
//   }
//   const data = response.data
//   if (data.items.length === 0) {
//     return
//   }
//   const albumsWithPopularity = await loadAlbumsPopularity40(data.items)
//   albums.value[group] = albums.value[group].concat(albumsWithPopularity)
//   nextUrls.value[group] = data.next
//   sortAlbums(group)
//   //wait 1 second to avoid rate limit
//   await new Promise(resolve => setTimeout(resolve, 1000))
//   await loadAllGroup(group)
// }

function assignAlbumToSongs(songs: any, album: any) {
  if (songs[0]?.album !== undefined) {
    return songs
  }
  for (const song of songs) {
    song.album = { id: album.id, images: album.images }
  }
  return songs
}

async function loadMoreAlbumSongs(album: any){
  // this function calls itslef recursively until all songs are loaded
  const url = album.tracks.next
  if (url === null) {
    return
  }
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (data.items.length === 0) {
    return
  }
  let songs = data.items
  if (!response?.cached) {
    songs = assignAlbumToSongs(songs, album)
    album.tracks.items = album.tracks.items.concat(songs)
    album.tracks.next = data.next
  }
  albumSongs.value = albumSongs.value.concat(songs)
  if (data.next !== null) {
    await loadMoreAlbumSongs(album)
  }
}

// function selectedSongsLabel(count: number) {
//   return `${count} song${count !== 1 ? 's' : ''} selected`
// }

async function selectAllAlbums(group: any) {
  selectAllAlbumsLoading.value = true
  if (allAlbumsSelected.value[group]) {
    selectedSongs.value = savedSongs.value
    allAlbumsSelected.value[group] = false
    checkAllAlbumsSelected(group)
    selectAllAlbumsLoading.value = false
    return
  }
  savedSongs.value = selectedSongs.value.map((song: any) => ({...song}))
  //await loadAllGroup('album') //this makes too many requests, it's annoying...
  if (albums.value[group] === undefined || albums.value[group].length === 0){
    return
  }
  for (const album of albums.value[group]) {
    if (album.selected) {
      continue
    }
    if (album.tracks.next !== null) {
      await loadMoreAlbumSongs(album)
      //wait a second to let the songs load and not exceed the rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    // add tracks that are not already selected
    for (const song of album.tracks.items) {
      if (selectedSongs.value.some((selectedSong: any) => selectedSong.id === song.id)) {
        continue
      }
      selectedSongs.value.push(song)
    }
    album.selected = true
    if (selectedSongs.value.length >= props.maxNumberofSongs) {
      selectedSongs.value = selectedSongs.value.slice(0, props.maxNumberofSongs)
      album.selected = null
      if (selectedSongs.value.length === props.maxNumberofSongs) {
        album.selected = true
      }
      break
    }
  }
  selectAllAlbumsLoading.value = false
  allAlbumsSelected.value[group] = true
}

function selectAllAlbumSongs() {
  if (selectedAlbumSelectedSongs.value.length === albumSongs.value.length) {
    unselectSelectedAlbumSongs()
    return
  }
  for (const song of albumSongs.value) {
    if (selectedSongs.value.some((selectedSong: any) => selectedSong.id === song.id)) {
      continue
    }
    selectedSongs.value.push(song)
  }
}

function isEmpty(obj: any) {
  return Object.keys(obj).length === 0
}

function showLoader(group: string){
  return nextUrls.value[group]
}

function showInitialLoader(group: string){
  return albums.value[group] === undefined
}

// function albumVariant(album: any) {
//   const selected = selectedSongs.value?.some((song: any) => song.album.id === album.id)
//   if (selected) {
//     return 'outlined'
//   }
//   return 'flat'
// }

function songsSelected(album: any) {
  const selected = selectedSongs.value?.some((song: any) => song.album.id === album.id)
  if (selected) {
    return 'text-weight-bold'
  }
  return ''
}

const selectedAlbumSelectedSongs = computed(() => {
  return selectedSongs.value.filter((song: any) => song.album.id === selectedAlbum.value.id)
})

function unselectSelectedAlbumSongs() {
  selectedSongs.value = selectedSongs.value.filter((song: any) => song.album.id !== selectedAlbum.value.id)
}

// const albumSongsDuration = computed(() => {
//   return albumSongs.value.reduce((acc: number, song: any) => acc + song.duration_ms, 0)
// })

// const albumSongsDurationFormatted = computed(() => {
//   return toMinuteSecond(albumSongsDuration.value)
// })

const albumAlbums = computed(() => {
  return albums.value['album']
})

const singleAlbums = computed(() => {
  return albums.value['single']
})

const compilationAlbums = computed(() => {
  return albums.value['compilation']
})

function toMinuteSecond(miliseconds: number) {
  const minutes = Math.floor(miliseconds / 60000)
  const seconds = ((miliseconds % 60000) / 1000).toFixed(0)
  return minutes + ':' + (parseInt(seconds) < 10 ? '0' : '') + seconds
}

function imageUrl(artist: any, priority: 0 | 2 = 0): string {
  // if priority is 0, it will return the first image (higher quality), if it's 2, it will return the last image
  if (artist?.images[priority]?.url !== undefined && artist?.images[priority]?.url) {
    return artist.images[priority].url
  }
  if (artist?.images[1]?.url !== undefined && artist?.images[1]?.url) {
    return artist.images[1].url
  }
  if (artist?.images[2-priority]?.url !== undefined && artist?.images[priority-2]?.url) {
    return artist.images[2-priority].url
  }
  return ''
}

function onRowClick(song: any) {
  if (selectedSongs.value.some((selectedSong: any) => selectedSong.id === song.id)) {
    selectedSongs.value = selectedSongs.value.filter((selectedSong: any) => selectedSong.id !== song.id)
    selectedAlbum.value.selected = checkIfSelected(selectedAlbum.value)
    return
  }
  if (selectedSongs.value.length >= props.maxNumberofSongs) {
    return
  }
  selectedSongs.value.push(song)
  selectedAlbum.value.selected = checkIfSelected(selectedAlbum.value)
}

function openSpotifyAppLink(album: any) {
  window.open(album.uri)
}

function sortAlbums(group: any){
  if (sortOption.value === 'release_date') {
    albums.value[group].sort((a: any, b: any) => {
      const aDate = new Date(a.release_date)
      const bDate = new Date(b.release_date)
      return (bDate.getTime() - aDate.getTime()) * (descending.value ? 1 : -1)
    })
  } else if (sortOption.value === 'popularity') {
    albums.value[group].sort((a: any, b: any) => {
      return (b.popularity - a.popularity) * (descending.value ? 1 : -1)
    })
  }
}

function onSelectionUpdate(newSelection: any) {
  selectedSongs.value = newSelection.slice(0, props.maxNumberofSongs)
  selectedAlbum.value.selected = checkIfSelected(selectedAlbum.value)
}
</script>

<style>
.body--dark  {
  .greyText {
    color: rgb(235, 235, 235);
  }
}
</style>
