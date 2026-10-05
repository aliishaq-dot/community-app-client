import { api } from "@/app/api/baseApi";
import type {
  Comment,
  CommentsPage,
  CreatePostDto,
  Post,
  UpdatePostDto,
} from "@/lib/types";

export interface GetPostsArgs {
  groupId: string;
  page: number;
  limit: number;
  search?: string;
}

interface PaginatedPostsResponse {
  items: Post[];
  page: number;
  limit: number;
  total: number;
}

export interface GetCommentsArgs {
  groupId: string;
  postId: string;
  page: number;
  limit: number;
}

export const postsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], GetPostsArgs>({
      query: ({ groupId, page, limit, search }) => ({
        url: `/groups/${groupId}/posts`,
        params: { page, limit, ...(search ? { search } : {}) },
        cache: "no-store",
      }),
      transformResponse: (response: PaginatedPostsResponse | Post[]) =>
        Array.isArray(response) ? response : response.items,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs.groupId}-${queryArgs.search ?? ""}`,
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
          currentArg?.limit !== previousArg?.limit ||
          currentArg?.search !== previousArg?.search
        );
      },
      providesTags: (result, _error, { groupId }) => [
        { type: "Post", id: `GROUP-${groupId}` },
        ...(result ?? []).map(({ id }) => ({ type: "Post" as const, id })),
      ],
    }),
    toggleLike: builder.mutation<
      { liked: boolean },
      { groupId: string; postId: string; pageArgs: GetPostsArgs }
    >({
      query: ({ groupId, postId }) => ({
        url: `/groups/${groupId}/posts/${postId}/like`,
        method: "POST",
      }),
      async onQueryStarted({ postId, pageArgs }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          postsApi.util.updateQueryData("getPosts", pageArgs, (draft) => {
            const post = draft.find((item) => item.id === postId);
            if (post) {
              post.likedByMe = !post.likedByMe;
              post.likeCount = (post.likeCount ?? 0) + (post.likedByMe ? 1 : -1);
            }
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getComments: builder.query<CommentsPage, GetCommentsArgs>({
      query: ({ groupId, postId, page, limit }) => ({
        url: `/groups/${groupId}/posts/${postId}/comments`,
        params: { page, limit },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}-${queryArgs.groupId}-${queryArgs.postId}`,
      transformResponse: (response: CommentsPage | Comment[]) =>
        Array.isArray(response)
          ? { items: response, page: 1, limit: response.length, total: response.length }
          : response,
      merge: (currentCache, newComments, { arg }) => {
        if (arg.page === 1) {
          currentCache.items = newComments.items;
          currentCache.page = newComments.page;
          currentCache.limit = newComments.limit;
          currentCache.total = newComments.total;
          return;
        }

        const commentsById = new Map(
          currentCache.items.map((comment) => [comment.id, comment]),
        );
        for (const comment of newComments.items) {
          commentsById.set(comment.id, comment);
        }
        currentCache.items = [...commentsById.values()];
        currentCache.page = newComments.page;
        currentCache.limit = newComments.limit;
        currentCache.total = newComments.total;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.groupId !== previousArg?.groupId ||
          currentArg?.postId !== previousArg?.postId ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.limit !== previousArg?.limit
        );
      },
      providesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
      ],
    }),
    createComment: builder.mutation<
      Comment,
      { groupId: string; postId: string; body: string }
    >({
      query: ({ groupId, postId, body }) => ({
        url: `/groups/${groupId}/posts/${postId}/comments`,
        method: "POST",
        body: { body },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
      ],
    }),
    updateComment: builder.mutation<
      Comment,
      { groupId: string; postId: string; commentId: string; body: string }
    >({
      query: ({ groupId, postId, commentId, body }) => ({
        url: `/groups/${groupId}/posts/${postId}/comments/${commentId}`,
        method: "PATCH",
        body: { body },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
      ],
    }),
    deleteComment: builder.mutation<
      void,
      { groupId: string; postId: string; commentId: string }
    >({
      query: ({ groupId, postId, commentId }) => ({
        url: `/groups/${groupId}/posts/${postId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
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
    recordPostView: builder.mutation<void, { groupId: string; postId: string }>(
      {
        query: ({ groupId, postId }) => ({
          url: `/groups/${groupId}/posts/${postId}/view`,
          method: "POST",
        }),
      },
    ),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useRecordPostViewMutation,
  useToggleLikeMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = postsApi;
