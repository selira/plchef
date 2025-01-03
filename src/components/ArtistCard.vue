<template>
  <q-card
    class="q-mx-xs q-my-sm artistCard"
    flat
    bordered
    style="min-height: 100px; max-width: 98vw;"
  >
    <q-card-section horizontal>
      <div :class="imageCardWidth()">
        <!-- <q-img
          :src="spotifyImage(artist, artistImageResolution)"
          @click="artist.selected = !artist.selected; artistSelected()"
          style="cursor: pointer; max-height: 125px; min-height: 125px;"
          fit="cover"
        > -->
        <q-img
          :src="spotifyImage(artist, artistImageResolution)"
          @click="artistPictureClicked()"
          style="cursor: pointer; max-height: 125px; min-height: 125px;"
          fit="cover"
        >
          <div style="position: absolute; bottom: 3px; right: 3px; background-color: transparent;" v-if="spotifyAuthStore.isPremium">
            <q-btn 
              round 
              color="black" 
              icon="casino" 
              style="position: absolute; bottom: 3px; right: 3px; background-color: transparent;"
              @click.stop="loadRandomSong()"
              size="sm"
              :loading="randomSongLoading"
            >
              <q-tooltip v-if="numberOfCols > 1">
                Play random song
              </q-tooltip>
            </q-btn>
          </div>
        </q-img>
      </div>
      <div :class="restOfCardWWidth()">
        <div class="row">
          <div class="col-8" :style="{'margin-right': squeezeArtistImage ? '-5px' : '0px'}">
            <div class="row justify-between">
              <q-item tag="label" style="min-width: 0;" :class="artistItemClass()">
                <q-item-section avatar class="q-pa-none q-ma-none" :style="{'min-width': squeezeArtistImage ? '42px' : '56px'}">
                  <q-checkbox
                    v-model="artist.selected"
                    @update:model-value="artistSelected"
                    :disable="props.disableSelection && !artist.selected"
                    class="q-pa-none q-ma-none"
                  >
                  </q-checkbox>
                </q-item-section>
                <q-item-section>
                  <q-item-label> <div class="ellipsis artistCardText">{{ artist.name }}</div></q-item-label>
                  <q-item-label caption>Popularity: {{ artist.popularity }}</q-item-label>
                </q-item-section>
              <q-tooltip v-if="props.disableSelection && !artist.selected"
                anchor="top middle"
                self="bottom middle"
              >
                Max songs selected
              </q-tooltip>
              <q-tooltip v-else-if="artist.name.length > ( numberOfCols > 1 ? 20 : 10 )"
                anchor="top middle"
                self="bottom middle"
              >
                {{ artist.name }}
              </q-tooltip>
              </q-item>
            </div> 
          </div>
          <div class="col-2">
            <div> 
              <q-btn
                label="Genres" 
                dense 
                no-caps
                :class="[!squeezeArtistImage ? 'q-mt-sm genreButton' : 'q-mr-xs q-mt-sm genreButton']"
                class="q-mt-sm genreButton"
                :ripple="false"
                text-color="grey-3"
              >
              <q-menu>
              <!-- <div style="flex-direction: row; flex-wrap: wrap; max-width: 200px;"> -->
              <div :style="{'flex-direction': 'row', 'flex-wrap': 'wrap', 'max-width': colPixelsForGenreMenu(artist.genres)}">
              <!-- <div class="column"> -->
                <q-chip
                  v-for="genre in artist.genres"
                  :key="genre"
                  :label="genre"
                  color="accent"
                  clickable
                  @click="searchGenreChip(genre)"
                  text-color="white"
                ></q-chip>
              </div>
              </q-menu>
              </q-btn>
            </div>
          </div>
          <div class="col-1">
            <div class="q-mr-sm">
              <q-icon
                :name="relatedArtistsIcon()"
                :class="[!squeezeArtistImage ? 'q-mt-sm q-ml-md' : 'q-ml-sm q-mt-sm q-pl-xs']"
                size="md"
                style="cursor: pointer;"
                @click.stop
              >
                <q-menu>
                  <q-list>
                    <!-- <q-item
                      key="related-artists"
                      clickable
                      @click="showRelatedArtists()"
                    >
                      <q-item-section>Select Related Artists</q-item-section>
                    </q-item> -->
                    <q-item
                      key="spotify-app-link"
                      clickable
                      @click="openSpotifyAppLink()"
                    >
                      <q-item-section>Open Spotify</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-icon>
            </div>
          </div>
        </div>
        <div class="q-ml-md row" v-if="artist.selected">
          <div class="col-5">
            <q-select
              v-model="artist.selection"
              label="Selection"
              :options="artistSelections"
              option-label="title"
              @update:model-value="artistSelectionChanged()"
            ></q-select>
          </div>
          <div :class="[numberOfCols >= 2 ? 'col-5' : 'col-6 q-mt-sm']">
            <div v-if="artist.selection.value === 'top-10'">
              <q-slider
                :model-value="artist.numberOfSongs"
                @change="sliderChange"
                :min="1"
                :max="artist.loadedSongs.length === 0 ? 10 : artist.loadedSongs.length"
                :step="1"
                color="primary"
                class="q-mb-none q-pd-none"
                label
                @click="$event.target.blur()"
              />
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                :loading="topTenButtonDropdownLoading"
                dense
                unelevated
                @show="topTenLoadFromMenu()"
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                ref="topTenButtonDropdown"
                class="q-ml-sm"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div v-if="artist.selection.value === 'random'">
              <q-slider
                :model-value="artist.numberOfSongs"
                @change="sliderChange"
                :min="1"
                :max="artist.loadedSongs.length === 0 ? defaultNumberOfRandomSongs : artist.loadedSongs.length"
                :step="1"
                color="primary"
                class="q-mb-none q-pd-none"
                label
                @click="$event.target.blur()"
              />
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                :loading="topTenButtonDropdownLoading"
                dense
                unelevated
                @show="topTenLoadFromMenu()"
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                ref="topTenButtonDropdown"
                class="q-ml-sm"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div v-if="artist.selection.value === 'latest-release'">
              <div>
                <q-card
                  dense
                  style="padding: 0px;"
                  flat
                  bordered
                  class="q-ml-xs"
                >
                  <q-card-section class="q-ma-none q-pa-none">
                    <div class="text-caption ellipsis text-center">{{ latestReleaseName() }}
                      <q-tooltip v-if="latestReleaseName().length > 17"
                        anchor="top middle"
                        self="bottom middle"
                      >
                        {{ latestReleaseName() }}
                      </q-tooltip>
                    </div>
                    <div class="text-caption text-center">{{ latestReleaseDate() }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                dense
                unelevated
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                :disable="artist.loadedSongs.length === 0"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                class="q-ml-xs"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div v-if="artist.selection.value === 'most-popular'">
              <div>
                <q-card
                  dense
                  style="padding: 0px;"
                  flat
                  bordered
                  class="q-ml-xs"
                >
                  <q-card-section class="q-ma-none q-pa-none">
                    <div class="text-caption ellipsis text-center">{{ latestReleaseName() }}
                      <q-tooltip v-if="latestReleaseName().length > 17"
                        anchor="top middle"
                        self="bottom middle"
                      >
                        {{ latestReleaseName() }}
                      </q-tooltip>
                    </div>
                    <div class="text-caption text-center">{{ latestReleaseDate() }}</div>
                  </q-card-section>
                </q-card>
              </div>
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                dense
                unelevated
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                :disable="artist.loadedSongs.length === 0"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                class="q-ml-xs"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div v-if="artist.selection.value === 'recommendations'" class="q-mt-sm">
              <div>
                <q-btn
                  unelevated
                  dense
                  color="primary"
                  no-caps
                  size="sm"
                  class="q-mb-xs q-ml-sm"
                  :label="recommendationsButtonTitle()"
                  @click="openRecommendationsDialog()"
                  style="min-width: 120px;"
                />
              </div>
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                dense
                unelevated
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                :disable="artist.loadedSongs.length === 0"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                style="min-width: 120px;"
                class="q-ml-sm"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
            <div v-if="artist.selection.value === 'browse-catalog'" class="q-mt-sm">
              <div>
                <q-btn
                  unelevated
                  dense
                  color="primary"
                  no-caps
                  size="sm"
                  class="q-mb-xs q-ml-sm"
                  label="Browse Catalog"
                  style="min-width: 120px;"
                  @click="openCatalogDialog()"
                />
              </div>
              <q-btn-dropdown
                color="secondary"
                :label="'Songs Selected: ' + artist.numberOfSongs "
                no-caps
                :size="topTenDropdownSize()"
                dense
                unelevated
                style="min-width: 120px;"
                :disable-dropdown="artist.loadedSongs.length > 10 || numberOfCols < 3"
                :disable="artist.loadedSongs.length === 0"
                @click="dropdownMenuButtonClickedWithLatestRelease()"
                class="q-ml-sm"
              >
                <q-list dense>
                  <q-item
                    v-for="(song, index) in artist.loadedSongs"
                    :key="song.id"
                    :class="{unselectedSong: index > artist.numberOfSongs - 1, selectedSong: index <= artist.numberOfSongs - 1}"
                  >
                    <q-item-section avatar>
                      <q-icon :name="songIcon(index)" @click.stop="selectSongInMenu(song, index)" size="sm" :class="songIconClass(index)"/>
                    </q-item-section>
                    <q-item-section avatar v-if="spotifyAuthStore.isPremium">
                      <q-btn round color="black" icon="play_arrow" @click.stop="playSong(song)" size="sm">
                      </q-btn>
                    </q-item-section>
                    <q-item-section avatar>
                      <q-avatar v-if="spotifyImage(song.album, 'low-res') !== ''" square>
                        <img :src="spotifyImage(song.album, 'low-res')"/>
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ song.name }}</q-item-label>
                      <q-item-label caption>{{ song.artists.map((artist: any) => artist.name).join(', ') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side avatar>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="more_vert"
                        class="q-mt-xs"
                        color="black"
                        @click.stop
                      >
                        <q-menu auto-close>
                          <q-list>
                            <q-item
                              key="spotify-app-link"
                              clickable
                              @click="openTrackSpotifyAppLink(song)"
                            >
                              <q-item-section>Listen on Spotify</q-item-section>
                            </q-item>
                            <q-item
                              key="add-to-queue"
                              clickable
                              @click="addSongToQueue(song)"
                              v-if="spotifyAuthStore.isPremium"
                            >
                              <q-item-section>Add to Queue</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-btn>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </div>
          <div class="col-2" v-if="numberOfCols >= 2">
            <q-btn
              flat
              round
              icon="edit"
              class="q-ml-sm q-mt-xs editIcon"
              :disable="songEditoDialogButtonDisabled()"
              @click="openSongEditorDialog()"
            >
              <q-tooltip v-if="songEditoDialogButtonDisabled()"
                anchor="top middle"
                self="bottom middle"
              >
                Select songs
            </q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, defineModel } from 'vue'
import { useSpotifyRequests } from '../stores/requests'
import { useSpotifyAuthStore } from '../stores/spotify_auth'
import { useRouter } from 'vue-router'
import { spotifyImage } from '../functions/utils'
import { useQuasar } from 'quasar'

interface RecommendationsInfo {
  numberOfSongs: number,
  popularity: number | null,
  activated: boolean
}

const $q = useQuasar()

const emit = defineEmits<{
  (e: 'playSong', song: any, playerType: string, context: any): void
  (e: 'artistSelected', artist: any, selected: boolean): void
  (e: 'updateSelectedArtistsStore'): void
  (e: 'showRelatedArtists', artist: any): void
  (e: 'openRecommendationsDialog', artist: any): void
  (e: 'openCatalogDialog', artist: any): void
  (e: 'openSongEditorDialog', artist: any): void
}>()

const props = defineProps<{
  artistImageResolution: 'high-res' | 'mid-res' | 'low-res',
  numberOfCols: number,
  squeezeArtistImage: boolean,
  shuffleTopTen: boolean,
  automaticRecommendationsInfo: RecommendationsInfo,
  disableSelection: boolean,
  defaultArtistSelection: string,
  defaultNumberOfSongs: number,
  defaultNumberOfRandomSongs: number,
  prioritizePopularAlbums: boolean,
  defaultNumberOfAlbums: number
}>()

const loadingRecommendations = ref(false)
const randomSongLoading = ref(false)

const router = useRouter()
const artist = defineModel<any>({required: true})

const requestsStore = useSpotifyRequests()

const spotifyAuthStore = useSpotifyAuthStore()
const market = spotifyAuthStore.market || 'US'
const topTenButtonDropdown = ref<any>()
const topTenButtonDropdownLoading = ref(false)
// const alreadyPlayedTracks = ref([]) as any
// let randomSongsStack = [] as any

const artistSelections = [
  {title: 'Top 10 songs', value: 'top-10', description: 'Top 10 songs'},
  {title: 'Latest release', value: 'latest-release', description: 'Latest release'},
  {title: 'Browse catalog', value: 'browse-catalog', description: 'Songs from catalog'},
  // {title: 'Recommended songs', value: 'recommendations', description: 'Recommended songs based on artist'},
  {title: 'Most popular album', value: 'most-popular', description: 'Most popular album'},
  {title: 'Random Selection', value: 'random', description: 'Random selection from Catalog'}
]

//callbacks in template

function sliderChange(value: number) {
  artist.value.numberOfSongs = value
  emit('updateSelectedArtistsStore')
}

function artistPictureClicked() {
  if (spotifyAuthStore.isPremium) {
    playTopSong()
  } else {
    artist.value.selected = !artist.value.selected
    artistSelected()
  }
}

async function playTopSong() {
  const topSong = await getTopSong(artist.value)
  if (topSong === undefined) {
    return
  }
  playSong(topSong)
}

function artistSelected() {
  if (artist.value.selection.value === 'top-10' && artist.value.loadedSongs.length === 0) {
    loadTopTenSongsWithTimeout(5)
  }
  if (artist.value.selection.value === 'latest-release' && artist.value.loadedSongs.length === 0) {
    loadLatestRelease()
  }
  // if (artist.value.selection.value === 'recommendations') {
  //   if (props.automaticRecommendationsInfo.activated && artist.value.loadedSongs.length === 0) {
  //     loadRecommendations(props.automaticRecommendationsInfo.numberOfSongs, props.automaticRecommendationsInfo.popularity)
  //   } else if (artist.value.selected && artist.value.loadedSongs.length === 0 && props.defaultArtistSelection === 'recommendations'){
  //     openRecommendationsDialog()
  //   }  
  // }
  if (artist.value.selection.value === 'browse-catalog' && artist.value.selected && artist.value.loadedSongs.length === 0 && props.defaultArtistSelection === 'browse-catalog') {
    openCatalogDialog()
  }
  if (artist.value.selection.value === 'random' && artist.value.selected && artist.value.loadedSongs.length === 0 && props.defaultArtistSelection === 'random') {
    loadRandomSongs()
  }
  if (artist.value.selection.value === 'most-popular' && artist.value.loadedSongs.length === 0) {
    loadMostPopularAlbum()
  }
  emit('updateSelectedArtistsStore')
}

async function loadRandomSongs() {
  artist.value.numberOfSongs = props.defaultNumberOfSongs
  const url = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=album,single&limit=40&` + new URLSearchParams({market})
  let response = await requestsStore.getRequest(url)
  if (response.status !== 200 || response.data.items.length === 0) {
    return
  }
  // if (response.data.items.length === 0) {
  //   const url = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=single&limit=40&` + new URLSearchParams({market})
  //   response = await requestsStore.getRequest(url)
  //   if (response.status !== 200) {
  //     return
  //   }
  //   if (response.data.items.length === 0) {
  //     return
  //   }
  // }
  const data = response.data
  const albums = await loadAlbumsPopularity40(data.items)
  if (albums === undefined) {
    return
  }
  const songs = albums.flatMap((album: any) => album.tracks.items)
  let shuffledSongs
  if (props.prioritizePopularAlbums) {
    shuffledSongs = songs.sort((a: any, b: any) => Math.random() * b.album.popularity - Math.random() * a.album.popularity)
  } else {
    shuffledSongs = songs.sort(() => Math.random() - 0.5)
  }
  artist.value.loadedSongs = shuffledSongs
  artist.value.numberOfSongs = Math.min(shuffledSongs.length, props.defaultNumberOfRandomSongs)
  emit('updateSelectedArtistsStore')
}

async function loadMostPopularAlbum() {
  const url = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=album&limit=40&` + new URLSearchParams({market})
  let response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  if (response.data.items.length === 0) {
    const url = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=single&limit=40&` + new URLSearchParams({market})
    response = await requestsStore.getRequest(url)
    if (response.status !== 200) {
      return
    }
    if (response.data.items.length === 0) {
      return
    }
  }
  const data = response.data
  const albums = await loadAlbumsPopularity40(data.items)
  if (albums === undefined || albums.length === 0) {
    return
  }
  const selectedAlbums = albums.sort((a: any, b: any) => b.popularity - a.popularity)
                               .slice(0, props.defaultArtistSelection === 'most-popular' ? props.defaultNumberOfAlbums : 1)
  const albumTracks = selectedAlbums.flatMap((album: any) => album.tracks.items)
  artist.value.loadedSongs = albumTracks
  artist.value.numberOfSongs = albumTracks.length
  emit('updateSelectedArtistsStore')
}


// async function loadRecommendations(numberOfSongs: number, popularity: number | null) {
//   loadingRecommendations.value = true
//   let url = `https://api.spotify.com/v1/recommendations?seed_artists=${artist.value.id}&limit=${numberOfSongs}`
//   if (popularity !== null) {
//     url += `&target_popularity=${popularity}`
//   }
//   const response = await requestsStore.getRequest(url)
//   if (!response?.cached) {
//     response.data.tracks.forEach((track: any) => {
//       track.album = { id: track.album.id, images: track.album.images }
//       delete track.available_markets
//       delete track.disc_number
//       delete track.explicit
//       delete track.external_ids
//       delete track.href
//       delete track.is_local
//       delete track.type
//       delete track.track_number
//     })
//   }
//   artist.value.loadedSongs = response.data.tracks
//   artist.value.numberOfSongs = response.data.tracks.length
//   loadingRecommendations.value = false
//   emit('updateSelectedArtistsStore')
// }

function artistSelectionChanged() {
  // artist.selectedSongs = []
  artist.value.loadedSongs = []
  artist.value.numberOfSongs = artist.value.selection.value === 'top-10' ? 5 : 0
  if (artist.value.selection.value === 'browse-catalog') {
    openCatalogDialog()
  }
  if (artist.value.selection.value === 'top-10') {
    loadTopTenSongs()
  }
  if (artist.value.selection.value === 'recommendations') {
    openRecommendationsDialog()
  }
  if (artist.value.selection.value === 'latest-release') {
    loadLatestRelease()
  }
  if (artist.value.selection.value === 'random') {
    loadRandomSongs()
  }
  if (artist.value.selection.value === 'most-popular') {
    loadMostPopularAlbum()
  }
}

function selectSongInMenu(song: any, index: number) {
  if (index > artist.value.numberOfSongs - 1) {
    artist.value.loadedSongs.splice(index, 1)
    artist.value.loadedSongs.splice(artist.value.numberOfSongs, 0, song)
    artist.value.numberOfSongs++
  } else {
    artist.value.loadedSongs.splice(index, 1)
    artist.value.loadedSongs.push(song)
    artist.value.numberOfSongs--
  }
  emit('updateSelectedArtistsStore')
}

//loading data

function loadTopTenSongsWithTimeout(timeout = 0) {
  artist.value.numberOfSongs = props.defaultNumberOfSongs
  setTimeout(() => {
    loadTopTenSongs()
  }, timeout*1000)
}

async function loadTopTenSongs() {
  if (artist.value.selection.value !== 'top-10' || artist.value.loadedSongs.length > 0) {
    return
  }
  const url = `https://api.spotify.com/v1/artists/${artist.value.id}/top-tracks?` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (!response?.cached){
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
  if (props.shuffleTopTen) {
    data.tracks = data.tracks.sort(() => Math.random() - 0.5)
  }
  artist.value.loadedSongs = data.tracks
  // artist.value.numberOfSongs = Math.min(data.tracks.length, props.defaultNumberOfSongs)
  emit('updateSelectedArtistsStore')
}

async function topTenLoadFromMenu() {
  if (artist.value.selection.value !== 'top-10' || artist.value.loadedSongs.length > 0) {
    return
  }
  topTenButtonDropdownLoading.value = true
  topTenButtonDropdown.value.hide()
  await loadTopTenSongs()
  topTenButtonDropdownLoading.value = false
  topTenButtonDropdown.value.show()
}

async function loadLatestRelease() {
  if (artist.value.selection.value !== 'latest-release' || artist.value.loadedSongs.length > 0) {
    return
  }
  //run requests in parallel
  const url = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=album&limit=1&` + new URLSearchParams({market})
  // const response = await requestsStore.getRequest(url)
  // if (response.status !== 200) {
  //   return
  // }
  // const data = response.data
  const url2 = `https://api.spotify.com/v1/artists/${artist.value.id}/albums?include_groups=single&limit=1&` + new URLSearchParams({market})
  await requestsStore.tryRefreshToken()
  const data = await Promise.all([requestsStore.getRequest(url), requestsStore.getRequest(url2)])
  if (data[0].status !== 200 || data[1].status !== 200) {
    return
  }
  const albumAlbum = data[0].data.items[0]
  const single = data[1].data.items[0]
  let album = null as any
  if (!single) {
    album = albumAlbum
  } else if (!albumAlbum) {
    album = single
  } else if (!single && !albumAlbum) {
    return
  } else {
    album = new Date(albumAlbum?.release_date) > new Date(single?.release_date) ? albumAlbum : single
  }

  const albumTracks = await getAlbumTracks(album)
  
  artist.value.loadedSongs = albumTracks
  artist.value.numberOfSongs = albumTracks.length
  emit('updateSelectedArtistsStore')
}

async function getAlbumTracks(album: any) {
  const url = `https://api.spotify.com/v1/albums/${album.id}/tracks?` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (!response?.cached) {
    data.items.forEach((track: any) => {
      const artists = track.artists.map((artist: any) => {
        return { name: artist.name }
      })
      delete track.artists
      track.artists = artists
      const trackAlbum = { name: album.name, images: album.images, release_date: album?.release_date}
      track.album = trackAlbum
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

  return data.items
}

async function getTopSong(artist: any) {
  const url = `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?` + new URLSearchParams({market})
  const response = await requestsStore.getRequest(url)
  if (response.status !== 200) {
    return
  }
  const data = response.data
  if (!response?.cached) {
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
  // return first track with preview url defined
  for (let i = 0; i < data.tracks.length; i++) {
    return data.tracks[i]
  }
}

async function playRandomSongs(artist: any) {
  const url = `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=40&` + new URLSearchParams({market})
  let response = await requestsStore.getRequest(url)
  if (response.status !== 200 || response.data.items.length === 0) {
    return
  }
  const data = response.data
  const albums = await loadAlbumsPopularity40(data.items)
  if (albums === undefined) {
    return
  }
  const songs = albums.flatMap((album: any) => album.tracks.items).sort(() => Math.random() - 0.5).slice(0, 50)
  const playUrl = 'https://api.spotify.com/v1/me/player/play'
  const body = {
    // context_uri: context,
    uris: songs.map((track: any) => track.uri),
  }
  requestsStore.putRequest(playUrl, body)
}

async function loadRandomSong() {
  randomSongLoading.value = true
  await playRandomSongs(artist.value)
  randomSongLoading.value = false
  return
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
  if (response?.cached) {
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
    album.tracks.items.forEach((song: any) => {
      delete song.available_markets
      delete song.disc_number
      delete song.explicit
      delete song.href
      delete song.is_local
      delete song.track_number
      delete song.type
      delete song.is_playable
      song.album = { id: album.id, images: album.images, name: album.name, release_date: album.release_date, popularity: album.popularity }
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

// window and emits

function searchGenreChip(genre: string) {
  router.push({ path: '/artists', query: { genre: genre }})
}

function openSpotifyAppLink() {
  window.open(artist.value.uri, '_blank')
}

function openTrackSpotifyAppLink(song: any) {
  window.open(song.uri, '_blank')
}

async function addSongToQueue(song: any) {
  const addItemToPlaybackQueueUrl = 'https://api.spotify.com/v1/me/player/queue?uri=' + song.uri
  const response = await requestsStore.postRequest(addItemToPlaybackQueueUrl, {}, false)
  if (response.status === 200 || response.status === 204) {
    $q.notify('Song added to queue')
  }
}

function playSong(song: any, playerType = 'normal') {
  if (props.numberOfCols === 1) {
    playerType = 'mini'
  }
  const context = 'spotify:artist:' + artist.value.id
  emit('playSong', song, playerType, context)
}

// function playSongs(songs: any, playerType = 'normal') {
//   if (props.numberOfCols === 1) {
//     playerType = 'mini'
//   }
//   emit('playSong', songs, playerType, true)
// }

// function showRelatedArtists(){
//   emit('showRelatedArtists', artist.value)
// }

function openRecommendationsDialog() {
  emit('openRecommendationsDialog', artist.value)
}

function openCatalogDialog() {
  emit('openCatalogDialog', artist.value)
}

function openSongEditorDialog() {
  emit('openSongEditorDialog', artist.value)
}

function dropdownMenuButtonClickedWithLatestRelease() {
  if (artist.value.loadedSongs.length > 10 || props.numberOfCols < 3) {
    openSongEditorDialog()
  }
}

//css

function recommendationsButtonTitle() {
  if (loadingRecommendations.value) {
    return 'Loading...'
  }
  return 'Get Recommendations'
}

function latestReleaseName() {
  if (artist.value.loadedSongs.length === 0) {
    return 'Loading...'
  }
  return artist.value.loadedSongs[0].album.name
}

function latestReleaseDate() {
  if (artist.value.loadedSongs.length === 0) {
    return ''
  }
  return artist.value.loadedSongs[0].album.release_date
}

function songEditoDialogButtonDisabled() {
  if (artist.value.selection.value !== 'top-10' && artist.value.loadedSongs.length === 0) {
    return true
  }
  return false
}

function topTenDropdownSize() {
  return 'sm'
}

function colPixelsForGenreMenu(genres: string[]) {
  // get max length of genres and multiply by 8
  const maxGenreLength = genres.reduce((a: number, b: string) => a > b.length ? a : b.length, 0)
  return `${maxGenreLength * 8 + 37}px`
}

function songIconClass(index: number) {
  if (index > artist.value.numberOfSongs - 1) {
    return 'songNotIncludedIcon'
  }
  return 'songIncludedIcon'
}

function songIcon(index: number) {
  if (index > artist.value.numberOfSongs - 1) {
    return 'add'
  }
  return 'remove'
}

function imageCardWidth() {
  if (props.squeezeArtistImage) {
    return 'col-4'
  }
  return 'col-3'
}

function restOfCardWWidth() {
  if (props.squeezeArtistImage) {
    return 'col-8'
  }
  return 'col-9'
}

function relatedArtistsIcon() {
  if (props.squeezeArtistImage) {
    return 'more_vert'
  }
  return $q.dark.isActive ? 'img:icons/Spotify_Icon_RGB_Green.png' : 'img:icons/Spotify_Icon_RGB_Black.png'
}
function artistItemClass() {
  if (props.squeezeArtistImage) {
    return 'q-pa-none q-ma-none'
  }
  return ''
}
</script>

<style lang="scss" scoped>
.body--dark {
  .artistCard {
    background: rgb(34, 34, 34);
    border-color: rgb(48, 48, 48);
  }

  .artistCardText {
    color: rgba(235, 235, 235);
  }

  .genreButton {
    background: rgb(16, 16, 16);
  }

  .editIcon {
    color: rgba(200, 200, 200);
  }

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
  .artistCard {
    background: transparent
  }

  .genreButton {
    background: rgb(16, 16, 16);
  }

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