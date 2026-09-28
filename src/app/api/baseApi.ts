import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react'
import { Mutex } from 'async-mutex'
import { useAuthStore } from '@/app/store/authStore'

const mutex = new Mutex()

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  await mutex.waitForUnlock()
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire()
      try {
        const refreshResult = await baseQuery(
          { url: '/auth/refresh', method: 'POST' },
          api,
          extraOptions
        )
        if (refreshResult.data) {
          const { accessToken, user } = refreshResult.data as { accessToken: string; user: any }
          useAuthStore.getState().setSession(accessToken, user)
          result = await baseQuery(args, api, extraOptions)
        } else {
          useAuthStore.getState().clear()
        }
      } finally {
        release()
      }
    } else {
      await mutex.waitForUnlock()
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Group', 'Membership', 'Post'],
  endpoints: () => ({}),
})