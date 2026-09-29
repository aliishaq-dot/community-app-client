import { api } from "@/app/api/baseApi";
import type { CreatePostDto, Post, UpdatePostDto } from "@/lib/types";

interface GetPostsArgs {
  groupId: string;
  page: number;
  limit: number;
}

interface PaginatedPostsResponse {
  items: Post[];
  page: number;
  limit: number;
  total: number;
}

export const postsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], GetPostsArgs>({
      query: ({ groupId, page, limit }) => ({
        url: `/groups/${groupId}/posts`,
        params: { page, limit },
        cache: "no-store",
      }),
      transformResponse: (response: PaginatedPostsResponse | Post[]) =>
        Array.isArray(response) ? response : response.items,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs.groupId}`,
      merge: (currentCache, newPosts, { arg }) => {
        if (arg.page === 1) {
          return newPosts;
        }

        const postsById = new Map(currentCache.map((post) => [post.id, post]));
        for (const post of newPosts) {
          postsById.set(post.id, post);
        }

        currentCache.splice(0, currentCache.length, ...postsById.values());
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.groupId !== previousArg?.groupId ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.limit !== previousArg?.limit
        );
      },
      providesTags: (result, _error, { groupId }) => [
        { type: "Post", id: `GROUP-${groupId}` },
        ...(result ?? []).map(({ id }) => ({ type: "Post" as const, id })),
      ],
    }),
    createPost: builder.mutation<
      Post,
      { groupId: string; body: CreatePostDto }
    >({
      query: ({ groupId, body }) => ({
        url: `/groups/${groupId}/posts`,
        method: "POST",
        body,
      }),
    }),
    updatePost: builder.mutation<
      Post,
      { groupId: string; postId: string; body: UpdatePostDto }
    >({
      query: ({ groupId, postId, body }) => ({
        url: `/groups/${groupId}/posts/${postId}`,
        method: "PATCH",
        body,
      }),
    }),
    deletePost: builder.mutation<void, { groupId: string; postId: string }>({
      query: ({ groupId, postId }) => ({
        url: `/groups/${groupId}/posts/${postId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
