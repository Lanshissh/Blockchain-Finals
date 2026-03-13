import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import LoginPage from "../views/LoginPage.vue";
import { useAuctus } from "../app.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: App
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      beforeEnter: () => {
        const { account } = useAuctus();
        if (account.value) {
          return "/";
        }
        return true;
      }
    }
  ]
});

export default router;
