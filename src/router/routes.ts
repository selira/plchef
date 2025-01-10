import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/PlaylistManager.vue'),
  },
  {
    path: '/artists',
    component: () => import('layouts/LayoutWithoutSidebar.vue'),
    children: [{ path: '', component: () => import('pages/ArtistSelector.vue') }],
    meta: {
      requiresAuth: true,
    }
  },
  {
    path: '/genres',
    component: () => import('layouts/LayoutWithoutSidebar.vue'),
    children: [{ path: '', component: () => import('pages/GenresPage.vue') }],
  },
  {
    path: '/login',
    component: () => import('layouts/LayoutWithoutSidebar.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }]
  },
  {
    path: '/privacy-policy',
    component: () => import('layouts/LayoutWithoutSidebar.vue'),
    children: [{ path: '', component: () => import('pages/PrivacyPolicy.vue') }],
  },
  {
    path: '/terms-of-service',
    component: () => import('layouts/LayoutWithoutSidebar.vue'),
    children: [{ path: '', component: () => import('pages/TermsOfService.vue') }],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
