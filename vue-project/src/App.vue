<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { provide } from 'vue'

const router = useRouter()

onErrorCaptured((error) => {
  console.error('Global error caught:', error)
  router.push({ name: 'projects' })
  return false
})

provide('router-view-location', {})
</script>

<template>
  <div id="app">
    <RouterView v-slot="{ Component }">
      <template v-if="Component">
        <Transition mode="out-in">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="loading">Loading...</div>
            </template>
          </Suspense>
        </Transition>
      </template>
    </RouterView>
  </div>
</template>

<style lang="scss">
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  margin-bottom: 2rem;

  nav {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;

    a {
      color: #2c3e50;
      text-decoration: none;
      font-weight: bold;

      &.router-link-active {
        color: #42b883;
      }
    }
  }
}

main {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.2rem;
  color: #666;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.15s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
