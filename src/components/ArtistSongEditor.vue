<template>
  <q-card style="min-width: 65vw;">
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div>
        <div :class="titleColClass()">
          <q-card>
            <q-card-section>
              <div class="row" style="min-width: 0;">
                <div class="col-2">
                  <q-img
                    :src="imageUrl(props.artist, 2)"
                    height="50px" 
                    fit="contain"
                  ></q-img>
                </div>
                <div class="column col-9 ellipsis">
                  <div class="text-h6 q-ml-md">
                    {{ props.artist.name }}
                  </div>
                  <div class="text-subtitle2 q-ml-md">
                    {{ cardSubtitle() }}
                  </div>
                </div>
                
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <div>
        <div :class="searchColClass()">
          <div class="row justify-between">
            <div :class="searchItemColClass()">
              <div class="row flex-center">
                <div>
                  <q-btn
                    color="primary"
                    @click="shuffleSongs"
                    label="Shuffle"
                  ></q-btn>
                </div>
              </div>
            </div>
            <div class="col-3 q-pa-md" v-if="numberOfCols > 1">
              <q-select
                v-model="sortProperty"
                :options="sortProperties"
                label="Sort By"
                outlined
                @update:model-value="sortSongs"
              />
            </div>
            <div class="col-3 q-pa-md" v-if="numberOfCols > 1">
              <q-select
                v-model="descending"
                :options="[{label: 'Descending', value: true}, {label: 'Ascending', value: false}]"
                label="Order"
                outlined
                emit-value
                map-options
                @update:model-value="sortSongs"
              />
            </div>
            <div :class="searchItemColClass()">
              <div class="q-mr-sm">
              <q-slider
                v-if="loadedSongs.length > 50"
                :min="0"
                :max="loadedSongs.length"
                outlined
                :model-value="numberOfSongs"
                @change="val => { numberOfSongs = val }"
                label
                switch-label-side
              />
              <q-slider
                v-else
                v-model="numberOfSongs"
                :min="0"
                :max="loadedSongs.length"
                outlined
              />
              </div>
              <q-badge color="secondary">
                Number of Songs: {{ numberOfSongs }}
              </q-badge>
            </div>
          </div>
        </div>
      </div>
      <q-separator/>
      <div style="min-height: 0px; flex: 1 1 auto; overflow-y: auto;" id="virtual-scroll-target">
        <div>
          <q-virtual-scroll
            scroll-target="#virtual-scroll-target"
            :items="loadedSongs"
            separator
            v-slot="{ item, index }"
          >
            <q-item
              :key="item.id"
              :class="{unselectedSong: index > numberOfSongs - 1, selectedSong: index <= numberOfSongs - 1}"
              dense
            >
              <q-item-section avatar class="q-ma-none q-pa-none" :style="{'min-width': numberOfCols === 1 ? '45px' : '56px'}">
                <q-icon class="q-ma-none q-pa-none" :name="songIcon(index)" @click="moveSong(item, index)" size="md" :class="songIconClass(index)"/>
              </q-item-section>
              <q-item-section avatar v-if="numberOfCols > 1">
                <q-btn
                  icon="arrow_upward" 
                  @click.prevent="moveSongUpwards(item)" 
                  size="xs" 
                  :ripple="false" 
                  unelevated
                  dense
                />
                <q-btn
                  icon="arrow_downward" 
                  @click.prevent="moveSongDownwards(item)" 
                  size="xs" 
                  :ripple="false" 
                  unelevated
                  dense
                />
              </q-item-section>
              <q-item-section avatar class="q-ma-none q-pa-none" :style="{'min-width': numberOfCols === 1 ? '45px' : '56px'}" v-if="spotifyAuthStore.isPremium">
                <q-btn round class="q-ma-none q-pa-none" color="black" icon="play_arrow" @click.prevent="playSong(item)" size="sm">
                </q-btn>
              </q-item-section>
              <q-item-section avatar>
                <q-avatar v-if="imageUrl(item.album) !== ''" square>
                  <img :src="imageUrl(item.album)"/>
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
                <q-item-label caption>{{ songArtists(item) }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="songShowsProperty(item) && numberOfCols > 1">
                <q-item-label>{{ sortProperty.label }}: {{ formattedSongProperty(item) }}</q-item-label>
              </q-item-section>
              <q-item-section side v-else-if="loadingProperties">
                <q-item-label>Loading...</q-item-label>
              </q-item-section>
              <q-item-section side avatar>
                <q-btn
                  flat
                  round
                  icon="more_vert"
                  color="black"
                  @click.stop
                >
                  <q-menu class="z-max" auto-close>
                    <q-list>
                      <q-item
                        key="spotify-app-link"
                        clickable
                        @click="openSpotifyAppLink(item)"
                      >
                        <q-item-section>Listen on Spotify</q-item-section>
                      </q-item>
                      <q-item
                        key="add-to-queue"
                        clickable
                        @click="addSongToQueue(item)"
                        v-if="spotifyAuthStore.isPremium"
                      >
                        <q-item-section>Add to Queue</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-virtual-scroll>
        </div>
      </div>
      <q-separator/>
      <div>
        <q-card-actions>
          <q-btn
            color="primary"
            @click="confirmSelection"
          >Confirm</q-btn>
          <q-btn
            color="negative"
            @click="emit('closeDialog')"
          >Cancel</q-btn>
        </q-card-actions>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSpotifyRequests } from '../stores/requests'
import { useQuasar } from 'quasar'
import { useSpotifyAuthStore } from '../stores/spotify_auth'

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'confirmSelection', loadedSongs: any, numberOfSongs: any): void
  (e: 'playSong', song: any, playerType: string): void
}>()

const props = defineProps<{ artist: any, numberOfCols: number }>()
const $q = useQuasar()
const menuOpen = ref(false)

const spotifyAuthStore = useSpotifyAuthStore()
const requestsStore = useSpotifyRequests()
const loadedSongs = ref([]) as any
const numberOfSongs = ref(0)
const sortProperty = ref({ label: 'None', value: ''})
const sortProperties = ref([
  { label: 'None', value: ''},
  { label: 'Popularity', value: 'popularity' },
  // { label: 'Danceability', value: 'danceability' },
  // { label: 'Energy', value: 'energy' },
  // { label: 'Loudness', value: 'loudness' },
  // { label: 'Speechiness', value: 'speechiness' },
  // { label: 'Acousticness', value: 'acousticness' },
  // { label: 'Instrumentalness', value: 'instrumentalness' },
  // { label: 'Liveness', value: 'liveness' },
  // { label: 'Positivity', value: 'valence' },
  // { label: 'Tempo', value: 'tempo' },
  // { label: 'Duration', value: 'duration_ms' },
  // { label: 'Key', value: 'key' },
  // { label: 'Mode', value: 'mode' },
  // { label: 'Time Signature', value: 'time_signature' },
])
const keyNames = [
  'C',
  'C♯/D♭',
  'D',
  'D♯/E♭',
  'E',
  'F',
  'F♯/G♭',
  'G',
  'G♯/A♭',
  'A',
  'A♯/B♭',
  'B',
]
const descending = ref(true)
const loadingProperties = ref(false)

const nullAudioFeatures = {
    "danceability" : 0,
    "energy" : 0,
    "key" : 0,
    "loudness" : -30,
    "mode" : 0,
    "speechiness" : 0,
    "acousticness" : 0,
    "instrumentalness" : 0,
    "liveness" : 0,
    "valence" : 0,
    "tempo" : 0,
    "duration_ms" : 0,
    "time_signature" : 0
}

onMounted(async () => {
  props.artist.loadedSongs.forEach((song: any) => {
    loadedSongs.value.push(song)
  })
  numberOfSongs.value = props.artist.numberOfSongs
})

async function getTracksPopularity() {
  const tracks = loadedSongs.value.filter((song: any) => song.popularity === undefined).slice(0, 1000) //max 1000? lol
  if (tracks.length === 0) {
    return
  }
  const trackIdsInChunksOf50 = []
  for (let i = 0; i < tracks.length; i += 50) {
    trackIdsInChunksOf50.push(tracks.slice(i, i + 50).map((song: any) => song.id))
  }
  const popularityPromises = trackIdsInChunksOf50.map(
    (trackIds: any) => requestsStore.getRequest(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, true)
  )
  await requestsStore.tryRefreshToken()
  const popularityResponses = await Promise.all(popularityPromises)
  const popularities = popularityResponses.map((response: any) => response.data.tracks).flat()
  tracks.forEach((song: any, index: number) => {
    song.popularity = popularities[index].popularity
  })
}

async function getTracksAudioFeatures() {
  const tracks = loadedSongs.value.filter((song: any) => song.audioFeatures === undefined).slice(0, 1000) //max 1000? lol
  if (tracks.length === 0) {
    return
  }
  const trackIdsInChunksOf100 = []
  for (let i = 0; i < tracks.length; i += 100) {
    trackIdsInChunksOf100.push(tracks.slice(i, i + 100).map((song: any) => song.id))
  }
  const audioFeaturesPromises = trackIdsInChunksOf100.map(
    (trackIds: any) => requestsStore.getRequest(`https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`, true)
  )
  await requestsStore.tryRefreshToken()
  const audioFeaturesResponses = await Promise.all(audioFeaturesPromises)
  const audioFeatures = audioFeaturesResponses.map((response: any) => response.data.audio_features).flat()
  tracks.forEach((song: any, index: number) => {
    const features = audioFeatures[index]
    if (features === null) {
      song.audioFeatures = nullAudioFeatures
      return
    }
    delete features.type
    delete features.id
    delete features.uri
    delete features.track_href
    delete features.analysis_url
    song.audioFeatures = features
  })
}

function playSong(song: any) {
  emit('playSong', song, props.numberOfCols > 1 ? 'normal' : 'mini')
}

async function sortSongs() {
  loadingProperties.value = true
  await loadSongProperties()
  if (sortProperty.value.value === 'popularity') {
    sortByPopularity()
  } else {
    sortByProperty()
  }
  loadingProperties.value = false
}

function sortByProperty() {
  loadedSongs.value.sort((a: any, b: any) => {
    if (a.audioFeatures[sortProperty.value.value] < b.audioFeatures[sortProperty.value.value]) {
      return descending.value ? 1 : -1
    }
    if (a.audioFeatures[sortProperty.value.value] > b.audioFeatures[sortProperty.value.value]) {
      return descending.value ? -1 : 1
    }
    return 0
  })
}

function sortByPopularity() {
  loadedSongs.value.sort((a: any, b: any) => {
    if (a.popularity < b.popularity) {
      return descending.value ? 1 : -1
    }
    if (a.popularity > b.popularity) {
      return descending.value ? -1 : 1
    }
    return 0
  })
}

async function loadSongProperties() {
  if (sortProperty.value.value === 'popularity' && (props.artist.selection.value === 'browse-catalog'
      || props.artist.selection.value === 'latest-release' || props.artist.selection.value === 'random' || props.artist.selection.value === 'most-popular')) {
    await getTracksPopularity()
  }
  else if (sortProperty.value.value !== 'popularity') {
    await getTracksAudioFeatures()
  }
}

function shuffleSongs() {
  loadedSongs.value.sort(() => Math.random() - 0.5)
}

function confirmSelection() {

  // get rid of audioFeatures to save space.... maybe not
  loadedSongs.value = loadedSongs.value.map((song: any) => {
    // delete song.audioFeatures
    return song
  })
  emit('confirmSelection', loadedSongs.value, numberOfSongs.value)
}

function songArtists(song: any) {
  return song.artists.map((artist: any) => artist.name).join(', ')
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

function songIconClass(index: number) {
  if (index > numberOfSongs.value - 1) {
    return 'songNotIncludedIcon'
  }
  return 'songIncludedIcon'
}

function songIcon(index: number) {
  if (index > numberOfSongs.value - 1) {
    return 'add'
  }
  return 'remove'
}

function moveSong(song: any, index: number){
  if (index > numberOfSongs.value - 1) {
    includeSong(song)
  }
  else {
    excludeSong(song)
  }
}

function includeSong(song: any) {
  loadedSongs.value.splice(loadedSongs.value.indexOf(song), 1)
  loadedSongs.value.splice(numberOfSongs.value, 0, song)
  numberOfSongs.value++
}

function excludeSong(song: any) {
  loadedSongs.value.splice(loadedSongs.value.indexOf(song), 1)
  loadedSongs.value.push(song)
  numberOfSongs.value--
}

function songShowsProperty(song: any) {
  if (sortProperty.value.value === 'popularity') {
    return Object.hasOwn(song, 'popularity')
  }
  return Object.hasOwn(song, 'audioFeatures') && Object.hasOwn(song.audioFeatures, sortProperty.value.value)
}

function openSpotifyAppLink(song: any) {
  window.open(song.uri, '_blank')
}

async function addSongToQueue(song: any) {
  const addItemToPlaybackQueueUrl = 'https://api.spotify.com/v1/me/player/queue?uri=' + song.uri
  const response = await requestsStore.postRequest(addItemToPlaybackQueueUrl, {}, false)
  menuOpen.value = false
  if (response.status === 200 || response.status === 204) {
    $q.notify('Song added to queue')
  }
}

function moveSongUpwards(song: any) {
  const index = loadedSongs.value.indexOf(song)
  if (index === 0) {
    return
  }
  loadedSongs.value.splice(index, 1)
  loadedSongs.value.splice(index - 1, 0, song)
}

function moveSongDownwards(song: any) {
  const index = loadedSongs.value.indexOf(song)
  if (index === loadedSongs.value.length - 1) {
    return
  }
  loadedSongs.value.splice(index, 1)
  loadedSongs.value.splice(index + 1, 0, song)
}

function formattedSongProperty(song: any) {
  if (sortProperty.value.value === 'popularity') {
    return song.popularity
  }
  if (sortProperty.value.value === 'loudness') {
    return `${song.audioFeatures[sortProperty.value.value]} dB`
  }
  if (sortProperty.value.value === 'tempo') {
    return `${song.audioFeatures[sortProperty.value.value]} BPM`
  }
  if (sortProperty.value.value === 'duration_ms') {
    return toMinuteSecond(song.audioFeatures[sortProperty.value.value])
  }
  if (sortProperty.value.value === 'key') {
    return `${song.audioFeatures[sortProperty.value.value]} (${keyNames[song.audioFeatures[sortProperty.value.value]]})`
  }
  if (sortProperty.value.value === 'mode') {
    return `${song.audioFeatures[sortProperty.value.value]} (${song.audioFeatures[sortProperty.value.value] === 1 ? 'Major' : 'Minor'})`
  }
  if (sortProperty.value.value === 'time_signature') {
    return `${song.audioFeatures[sortProperty.value.value]} (${song.audioFeatures[sortProperty.value.value]}/4)`
  }
  return song.audioFeatures[sortProperty.value.value]
}

function toMinuteSecond(miliseconds: number) {
  const minutes = Math.floor(miliseconds / 60000)
  const seconds = ((miliseconds % 60000) / 1000).toFixed(0)
  return minutes + ':' + (parseInt(seconds) < 10 ? '0' : '') + seconds
}

function cardSubtitle() {
  if (props.artist.selection.value !== 'latest-release') {
    return props.artist.selection.description 
  }
  else {
    return `${props.artist.loadedSongs[0].album.name}`
  }
}

function titleColClass() {
  return `col-${props.numberOfCols > 2 ? 4 : 8}`
}

function searchColClass() {
  return `col-${props.numberOfCols > 2 ? 8 : 4}`
}

function searchItemColClass() {
  if (props.numberOfCols > 1) {
    return 'col-3 q-pa-md'
  }
  return 'col-6 q-pa-md'
}
</script>

<style lang="scss" scoped>
.body--dark {
  .selectedSong {
    background-color: rgb(52, 62, 75);
  }

  .songIncludedIcon {
    background-color: black;
    cursor: pointer;
  }

  .songNotIncludedIcon {
    background-color: black;
    cursor: pointer;
  }
}

.body--light {
  .unselectedSong {
    background-color: lightgray;
  }

  .songIncludedIcon {
    background-color: lightgray;
    cursor: pointer;
  }

  .songNotIncludedIcon {
    background-color: white;
    cursor: pointer;
  }
}

</style>