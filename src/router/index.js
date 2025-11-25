import { createRouter, createWebHashHistory } from "vue-router";
import Login from "../views/Login.vue";
import PlaylistList from "../views/PlaylistList.vue";
import PlaylistDetail from "../views/PlaylistDetail.vue";
import BackupManager from "../views/BackupManager.vue";
import BackupSongList from "../views/BackupSongList.vue";
import CompareView from "../views/CompareView.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/",
    name: "PlaylistList",
    component: PlaylistList,
    meta: { requiresAuth: true },
  },
  {
    path: "/detail",
    name: "PlaylistDetail",
    component: PlaylistDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/backup",
    name: "BackupManager",
    component: BackupManager,
    meta: { requiresAuth: true },
  },
  {
    path: "/backup/view",
    name: "BackupSongList",
    component: BackupSongList,
    meta: { requiresAuth: true },
  },
  {
    path: "/backup/compare",
    name: "CompareView",
    component: CompareView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const userInfo = localStorage.getItem("userInfo");

  if (to.meta.requiresAuth && !userInfo) {
    next("/login");
  } else if (to.path === "/login" && userInfo) {
    next("/");
  } else {
    next();
  }
});

export default router;
