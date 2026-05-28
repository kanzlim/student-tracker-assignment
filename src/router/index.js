import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import AssignmentsView from '../views/AssignmentsView.vue'
import StudentsView from '../views/StudentsView.vue'
import SettingsView from '../views/SettingsView.vue'
import StudentDashboardView from '../views/StudentDashboardView.vue'
import AnnouncementsView from '../views/AnnouncementsView.vue'

const routes = [
  {
    path: '/',
    component: LoginView
  },

  {
    path: '/register',
    component: RegisterView
  },

  {
    path: '/dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      roles: ['instructor', 'admin']
    }
  },

  {
    path: '/students',
    component: StudentsView,
    meta: {
      requiresAuth: true,
      roles: ['instructor', 'admin']
    }
  },

  {
    path: '/assignments',
    component: AssignmentsView,
    meta: {
      requiresAuth: true,
      roles: ['instructor', 'admin']
    }
  },

  {
    path: '/announcements',
    component: AnnouncementsView,
    meta: {
      requiresAuth: true,
      roles: ['instructor', 'admin']
    }
  },

  {
    path: '/settings',
    component: SettingsView,
    meta: {
      requiresAuth: true,
      roles: ['instructor', 'admin']
    }
  },

  {
    path: '/student-dashboard',
    component: StudentDashboardView,
    meta: {
      requiresAuth: true,
      roles: ['student']
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {

  const currentUser =
    JSON.parse(
      localStorage.getItem('currentUser')
    )

  // NOT LOGGED IN
  if (
    to.meta.requiresAuth &&
    !currentUser
  ) {

    next('/')
    return
  }

  // ROLE CHECK
  if (
    to.meta.roles &&
    !to.meta.roles.includes(currentUser?.role)
  ) {

    // STUDENT
    if (
      currentUser?.role === 'student'
    ) {

      next('/student-dashboard')
      return
    }

    // ADMIN / INSTRUCTOR
    if (
      currentUser?.role === 'instructor' ||
      currentUser?.role === 'admin'
    ) {

      next('/dashboard')
      return
    }

    next('/')
    return
  }

  next()
})

export default router