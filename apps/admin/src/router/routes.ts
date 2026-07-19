import type { RouteRecordRaw } from 'vue-router'
import {
  Gauge,
  PenLine,
  MessageCircle,
  MessagesSquare,
  FolderTree,
  Tags,
  Folder,
  Users,
  Settings,
  Bell,
  Panda
} from '@lucide/vue'
import AppLayout from '~/layouts/AppLayout.vue'

export const menuRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('~/views/dashboard/Dashboard.vue'),
    meta: {
      title: '仪表盘',
      icon: Gauge
    }
  },
  {
    path: '/posts',
    meta: {
      title: '文章',
      icon: PenLine
    },
    children: [
      {
        path: '',
        name: 'posts',
        component: () => import('~/views/posts/Posts.vue')
      },
      {
        path: 'new',
        name: 'postCreate',
        component: () => import('~/views/posts/PostEdit.vue')
      },
      {
        path: ':id',
        name: 'postEdit',
        component: () => import('~/views/posts/PostEdit.vue')
      }
    ]
  },
  {
    path: '/notes',
    meta: {
      title: '说说',
      icon: MessagesSquare
    },
    children: [
      {
        path: '',
        name: 'notes',
        component: () => import('~/views/notes/Notes.vue')
      }
    ]
  },
  {
    path: '/categories',
    meta: {
      title: '分类',
      icon: FolderTree
    },
    children: [
      {
        path: '',
        name: 'categories',
        component: () => import('~/views/categories/Categories.vue')
      }
    ]
  },
  {
    path: '/tags',
    meta: {
      title: '标签',
      icon: Tags
    },
    children: [
      {
        path: '',
        name: 'tags',
        component: () => import('~/views/tags/Tags.vue')
      }
    ]
  },
  {
    path: '/visitors',
    meta: {
      title: '访客',
      icon: Users
    },
    children: [
      {
        path: '',
        name: 'visitors',
        component: () => import('~/views/visitors/Visitors.vue')
      }
    ]
  },
  {
    path: '/friend-links',
    name: 'friendLinks',
    component: () => import('~/views/friend-links/FriendLinks.vue'),
    meta: {
      title: '友链',
      icon: Panda
    }
  },
  {
    path: '/comments',
    name: 'comments',
    component: () => import('~/views/comments/Comments.vue'),
    meta: {
      title: '评论',
      icon: MessageCircle
    },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('~/views/notifications/Notifications.vue'),
    meta: {
      title: '通知',
      icon: Bell
    }
  },
  {
    path: '/media',
    meta: {
      title: '媒体库',
      icon: Folder
    },
    children: [
      {
        path: '',
        name: 'media',
        component: () => import('~/views/media/MediaLibrary.vue')
      }
    ]
  },
  {
    path: '/settings',
    meta: {
      title: '设置',
      icon: Settings
    },
    children: [
      {
        path: '',
        name: 'settings',
        component: () => import('~/views/settings/Settings.vue')
      }
    ]
  }
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('~/views/auth/Login.vue')
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [...menuRoutes]
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    redirect: '/'
  }
]
