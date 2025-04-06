import { createMemoryHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/', name: 'root', redirect: { name: 'tool-lateclockins' } },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/tool/lateclockins',
    name: 'tool-lateclockins',
    component: () => import('@/views/tools/late_clock_ins/LateClockInsView.vue')
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router
