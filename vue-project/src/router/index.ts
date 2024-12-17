import ProjectDetails from "@/views/ProjectDetails.vue";
import ProjectList from "@/views/ProjectList.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "projects",
      component: ProjectList,
    },
    {
      path: "/project/:id",
      name: "project-details",
      component: ProjectDetails,
      props: true,
    },
  ],
});

export default router;
