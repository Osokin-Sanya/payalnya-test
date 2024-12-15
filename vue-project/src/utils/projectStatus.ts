import type { Task, Project, ProjectStatus } from '@/types'

export function calculateProjectStatus(tasks: Task[]): ProjectStatus {
  if (tasks.length === 0) return 'new'

  const hasInProgress = tasks.some((task) => task.status === 'in-progress')
  if (hasInProgress) return 'in-progress'

  const allDone = tasks.every((task) => task.status === 'done')
  if (allDone) return 'completed'

  const allNew = tasks.every((task) => task.status === 'new')
  if (allNew) return 'new'

  return 'in-progress'
}

export function updateProjectStatus(project: Project, tasks: Task[]): Project {
  const newStatus = calculateProjectStatus(tasks)
  if (project.status !== newStatus) {
    return { ...project, status: newStatus }
  }
  return project
}
