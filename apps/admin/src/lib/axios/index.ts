import axios from 'axios'
import router from '~/router'
import { useAppStore } from '~/stores/app'

export const apiClient = axios.create({
  baseURL: "/api",
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      useAppStore().adminUser = null
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
      return new Promise(() => {})
    }
    return Promise.reject(error)
  },
);
