import { defineStore } from 'pinia'

import type { User } from '@/types'
import { services } from '@/services'

const { users: userApi } = services

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getUserById: (state) => (id: string) => state.users.find((u) => u.id === id),
  },

  actions: {
    async fetchUsers() {
      this.loading = true
      try {
        const { data } = await userApi.getAll()
        this.users = data
      } catch (err) {
        this.error = 'Failed to fetch users'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
  },
})
