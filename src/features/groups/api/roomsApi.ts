import { api } from "@/app/api/baseApi";
import type { Room } from "@/lib/types";

interface GetRoomsArgs {
  groupId: string;
}

interface CreateRoomArgs {
  groupId: string;
  title?: string;
}

interface RoomCredentials {
  livekitUrl: string;
  token: string;
}

interface CreateRoomResponse extends RoomCredentials {
  roomId: string;
}

export const roomsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<Room[], GetRoomsArgs>({
      query: ({ groupId }) => `/groups/${groupId}/rooms`,
      providesTags: (_result, _error, { groupId }) => [
        { type: "Rooms", id: groupId },
      ],
    }),
    createRoom: builder.mutation<CreateRoomResponse, CreateRoomArgs>({
      query: ({ groupId, title }) => ({
        url: `/groups/${groupId}/rooms`,
        method: "POST",
        body: title ? { title } : {},
      }),
      invalidatesTags: (_result, _error, { groupId }) => [
        { type: "Rooms", id: groupId },
      ],
    }),
    joinRoom: builder.mutation<
      RoomCredentials,
      { groupId: string; roomId: string }
    >({
      query: ({ groupId, roomId }) => ({
        url: `/groups/${groupId}/rooms/${roomId}/join`,
        method: "POST",
      }),
    }),
  }),
});

export const { useGetRoomsQuery, useCreateRoomMutation, useJoinRoomMutation } =
  roomsApi;
