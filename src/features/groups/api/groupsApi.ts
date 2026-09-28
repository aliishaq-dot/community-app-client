import { api } from '@/app/api/baseApi'
import type { Group, CreateGroupDto, JoinGroupDto } from '@/lib/types'

export const groupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyGroups: builder.query<Group[], void>({
      query: () => '/groups',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Group' as const, id })),
              { type: 'Group', id: 'LIST' },
            ]
          : [{ type: 'Group', id: 'LIST' }],
    }),
    createGroup: builder.mutation<Group, CreateGroupDto>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
    joinGroup: builder.mutation<Group, JoinGroupDto>({
      query: (body) => ({ url: '/groups/join', method: 'POST', body }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetMyGroupsQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
} = groupsApi