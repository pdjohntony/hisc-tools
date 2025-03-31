import { createMemoryHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", name: "root", redirect: { name: "tool-lateclockins" } },
  {
    path: "/home",
    name: "home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/tool/lateclockins",
    name: "tool-lateclockins",
    component: () => import("@/views/ToolLateView.vue"),
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
