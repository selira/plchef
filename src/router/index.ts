import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { useSpotifyAuthStore } from '../stores/spotify_auth'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else {
        return { left: 0, top: 0 }
      }
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, _from, next) => {
    const spotifyAuthStore = useSpotifyAuthStore()
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!spotifyAuthStore.isLoggedIn) {
        next({ path: '/login' });
      } else {
        next();
      }
    } else {
      next();
    }
  });

  return Router;
});
