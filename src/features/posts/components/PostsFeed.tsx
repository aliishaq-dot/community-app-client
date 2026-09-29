import { useState } from "react";
import { useAuthStore } from "@/app/store/authStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePostMutation,
  useDeletePostMutation,
  useGetPostsQuery,
  useUpdatePostMutation,
} from "@/features/posts/api/postsApi";
import { postsApi } from "@/features/posts/api/postsApi";
import type { Group, Membership, Post } from "@/lib/types";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

const PAGE_LIMIT = 10;

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }

  return fallback;
}

function formatPostDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PostsFeed({
  group,
  members,
}: {
  group: Group;
  members?: Membership[];
}) {
  const currentUser = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editError, setEditError] = useState("");
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const postsArgs = { groupId: group.id, page, limit: PAGE_LIMIT };
  const {
    data: posts,
    isLoading,
    isFetching,
    error: postsError,
  } = useGetPostsQuery(postsArgs);
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const currentMembership =
    members?.find((membership) => membership.userId === currentUser?.id) ??
    group.memberships?.find(
      (membership) => membership.userId === currentUser?.id,
    );

  const updateCachedPosts = (recipe: (draft: Post[]) => void) => {
    const update = postsApi.util.updateQueryData("getPosts", postsArgs, recipe);
    return update;
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    try {
      const createdPost = await createPost({
        groupId: group.id,
        body: { title: title.trim(), body: body.trim() },
      }).unwrap();
      updateCachedPosts((draft) => {
        draft.splice(0, 0, createdPost);
        const seen = new Set<string>();
        for (let index = draft.length - 1; index >= 0; index -= 1) {
          if (seen.has(draft[index].id)) draft.splice(index, 1);
          else seen.add(draft[index].id);
        }
      });
      setTitle("");
      setBody("");
      setCreateDialogOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to create post."));
    }
  };

  const startEditing = (post: Post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
    setEditError("");
  };

  const handleUpdate = async (event: React.FormEvent, postId: string) => {
    event.preventDefault();
    setEditError("");

    try {
      const updatedPost = await updatePost({
        groupId: group.id,
        postId,
        body: { title: editTitle.trim(), body: editBody.trim() },
      }).unwrap();
      updateCachedPosts((draft) => {
        const index = draft.findIndex((post) => post.id === postId);
        if (index !== -1) draft[index] = updatedPost;
      });
      setEditingPostId(null);
    } catch (error) {
      setEditError(getErrorMessage(error, "Unable to update post."));
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    setDeleteError("");

    try {
      await deletePost({ groupId: group.id, postId: postToDelete.id }).unwrap();
      updateCachedPosts((draft) => {
        const index = draft.findIndex((post) => post.id === postToDelete.id);
        if (index !== -1) draft.splice(index, 1);
      });
      setPostToDelete(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Unable to delete post."));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading posts...</span>
      </div>
    );
  }

  if (postsError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {getErrorMessage(postsError, "Unable to load posts.")}
        </AlertDescription>
      </Alert>
    );
  }

  const visiblePosts = posts ?? [];
  const hasMore = visiblePosts.length >= page * PAGE_LIMIT;

  return (
    <div className="space-y-4">
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a post</DialogTitle>
            <DialogDescription>
              Share something with this group.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-body">Body</Label>
              <textarea
                id="post-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
                disabled={isCreating}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isCreating || !title.trim() || !body.trim()}
              >
                {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
                Create Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {visiblePosts.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center text-center">
            <div>
              <h2 className="font-medium">No posts yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Be the first to start a conversation.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        visiblePosts.map((post) => {
          const isAuthor = post.authorId === currentUser?.id;
          const canDelete =
            isAuthor ||
            ["ADMIN", "OWNER"].includes(currentMembership?.role ?? "");

          return (
            <PostCard
              key={post.id}
              post={post}
              isAuthor={isAuthor}
              canDelete={canDelete}
              isEditing={editingPostId === post.id}
              editTitle={editTitle}
              editBody={editBody}
              editError={editError}
              isUpdating={isUpdating}
              onStartEditing={() => startEditing(post)}
              onCancelEditing={() => setEditingPostId(null)}
              onEditTitleChange={setEditTitle}
              onEditBodyChange={setEditBody}
              onUpdate={(event) => handleUpdate(event, post.id)}
              onDelete={() => {
                setDeleteError("");
                setPostToDelete(post);
              }}
            />
          );
        })
      )}

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={isFetching}
        >
          {isFetching && <Loader2 className="animate-spin" />}
          Load more
        </Button>
      )}

      <AlertDialog
        open={Boolean(postToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPostToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              render={<Button variant="outline" />}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PostCard({
  post,
  isAuthor,
  canDelete,
  isEditing,
  editTitle,
  editBody,
  editError,
  isUpdating,
  onStartEditing,
  onCancelEditing,
  onEditTitleChange,
  onEditBodyChange,
  onUpdate,
  onDelete,
}: {
  post: Post;
  isAuthor: boolean;
  canDelete: boolean;
  isEditing: boolean;
  editTitle: string;
  editBody: string;
  editError: string;
  isUpdating: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onEditTitleChange: (value: string) => void;
  onEditBodyChange: (value: string) => void;
  onUpdate: (event: React.FormEvent) => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>
              {post.author.username} · {formatPostDate(post.createdAt)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {isAuthor && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onStartEditing}
                aria-label="Edit post"
              >
                <Pencil />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label="Delete post"
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={onUpdate} className="space-y-3">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
            <Input
              value={editTitle}
              onChange={(event) => onEditTitleChange(event.target.value)}
              required
            />
            <textarea
              value={editBody}
              onChange={(event) => onEditBodyChange(event.target.value)}
              required
              rows={4}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancelEditing}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !editTitle.trim() || !editBody.trim()}
              >
                {isUpdating && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>
        )}
      </CardContent>
    </Card>
  );
}
