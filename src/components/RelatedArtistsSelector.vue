<template>
  <q-card>
    <div style="display: flex; flex-direction: column; height: 100%;">
      <div style="min-height: 0px; flex: 1 1 auto; overflow-y: auto;">
        <div class="row q-mt-md q-mb-md">
          <div :class="artistColClass()" v-for="artistCol in artistCols" :key="artistCol.key" >
            <q-list>
              <q-item
                v-for="relatedArtist in artistCol.artists"
                :key="relatedArtist.id"
                tag="label"
              >
                <q-item-section avatar>
                  <q-checkbox v-model="selectedRelatedArtists" :val="relatedArtist" color="teal" />
                </q-item-section>
                <q-item-section avatar>
                  <!-- <q-icon name="play_circle" @click.stop="playSong(song)" size="md"/> -->
                  <q-btn round color="black" icon="play_arrow" @click.stop="playTopSong(relatedArtist)" size="sm">
                  </q-btn>
                </q-item-section>
                <q-item-section avatar>
                  <q-avatar v-if="artistImageUrl(relatedArtist) !== ''" square>
                    <img :src="artistImageUrl(relatedArtist)"/>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ relatedArtist.name }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </div>
      <q-separator />
      <div class="row">
      <q-card-actions>
        <q-btn
          color="primary"
          @click="selectRelatedArtists"
        >Select Artists</q-btn>
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
import { ref, onMounted, computed } from 'vue'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'

const emit = defineEmits<{
  (e: 'closeDialog'): void
  (e: 'selectRelatedArtists', selection: any): void
  (e: 'playSong', song: any, playerType: string): void
}>()

const props = defineProps<{ artist: any, artistIds: any, oneColumn: any }>()

const requestsStore = useSpotifyRequests()
const spotifyAuthStore = useSpotifyAuthStore()
const relatedArtists = ref([]) as any
const selectedRelatedArtists = ref([]) as any
const market = spotifyAuthStore.market || 'US'

onMounted(() => {
  loadRelatedArtists(props.artist)
})

async function loadRelatedArtists(artist: any) {
  const response = await requestsStore.getRequest(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`)
  if (response.status !== 200) {
    emit('closeDialog')
    return
  }
  // relatedArtists.value = response.data.artists.filter((artist: any) => {
  //   return props.artistIds.indexOf(artist.id) === -1
  // })
  relatedArtists.value = response.data.artists
}

const artistCols = computed(() => {
  // return relatedArtists divided in 2 arrays
  if (props.oneColumn) {
    return [{artists: relatedArtists.value, key: 1}]
  }
  const cols = [{artists: [], key: 1}, {artists: [], key: 2}] as any
  relatedArtists.value.forEach((artist: any, index: number) => {
    cols[index % 2].artists.push(artist)
  })
  return cols
})

function selectRelatedArtists() {
  emit('selectRelatedArtists', selectedRelatedArtists.value)
}

function artistImageUrl(artist: any): string {
  if (artist?.images[2]?.url !== undefined && artist?.images[2]?.url) {
    return artist.images[2].url
  }
  if (artist?.images[1]?.url !== undefined && artist?.images[1]?.url) {
    return artist.images[1].url
  }
  if (artist?.images[0]?.url !== undefined && artist?.images[0]?.url) {
    return artist.images[0].url
  }
  return ''
}

async function playTopSong(artist: any) {
  const topSong = await getTopSong(artist)
  emit('playSong', topSong, props.oneColumn ? 'none' : 'normal')
}

async function getTopSong(artist :any) {
  const url = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  return data.tracks[0]
}

function artistColClass() {
  return props.oneColumn ? 'col-12' : 'col-6'
}
</script>