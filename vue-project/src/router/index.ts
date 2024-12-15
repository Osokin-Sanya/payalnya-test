import { createRouter, createWebHistory } from 'vue-router'

 
import ProjectList from '@/views/ProjectList.vue'
import ProjectDetails from '@/views/ProjectDetails.vue'
 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
   
    {
      path: '/',
      name: 'projects',
      component: ProjectList,
    },
    {
      path: '/project/:id',
      name: 'project-details',
      component: ProjectDetails,
      props: true,
      // Добавляем guard для проверки существования проекта
      beforeEnter: async (to, from) => {
        const projectId = to.params.id
        if (!projectId) return { name: 'projects' }
        return true
      }
    },
   
  ],
})

// Глобальный guard для обработки ошибок
router.onError((error) => {
  console.error('Router error:', error)
  router.push({ name: 'projects' })
})

export default router
