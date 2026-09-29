import { api } from "@/app/api/baseApi";
import type {
  Group,
  CreateGroupDto,
  JoinGroupDto,
  Membership,
} from "@/lib/types";

export const groupsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyGroups: builder.query<Group[], void>({
      query: () => "/groups",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Group" as const, id })),
              { type: "Group", id: "LIST" },
            ]
          : [{ type: "Group", id: "LIST" }],
    }),
    createGroup: builder.mutation<Group, CreateGroupDto>({
      query: (body) => ({ url: "/groups", method: "POST", body }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),
    joinGroup: builder.mutation<Group, JoinGroupDto>({
      query: (body) => ({ url: "/groups/join", method: "POST", body }),
      invalidatesTags: [{ type: "Group", id: "LIST" }],
    }),
    getGroup: builder.query<Group, string>({
      query: (groupId) => `/groups/${groupId}`,
      providesTags: (_result, _error, groupId) => [
        { type: "Group", id: groupId },
      ],
    }),
    getGroupMembers: builder.query<Membership[], string>({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: (_result, _error, groupId) => [
        { type: "Membership", id: groupId },
      ],
    }),
  }),
});

export const {
  useGetMyGroupsQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
  useGetGroupQuery,
  useGetGroupMembersQuery,
} = groupsApi;
