import type { User } from '@/types'
import { api } from './api'

export const users = {
  async getAll() {
    return api.get<User[]>('/users')
  },
}
