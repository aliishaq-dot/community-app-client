import { api } from '@/app/api/baseApi'
import type { User } from '@/lib/types'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      { accessToken: string; user: User },
      { username: string; email: string; password: string }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<
      { accessToken: string; user: User },
      { email: string; password: string }
    >({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refresh: builder.mutation<{ accessToken: string; user: User }, void>({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetMeQuery,
} = authApi