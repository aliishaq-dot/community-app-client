import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/app/store/authStore";
import { useAppDispatch } from "@/app/store/hooks";
import {
  useLeaveGroupMutation,
  useGetGroupMembersQuery,
  useGetGroupQuery,
  useRegenerateGroupCodeMutation,
} from "@/features/groups/api/groupsApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveRoomsSection } from "@/features/groups/components/LiveRoomsSection";
import { postsApi } from "@/features/posts/api/postsApi";
import { PostsFeed } from "@/features/posts/components/PostsFeed";
import { getSocket } from "@/lib/socket";
import type {
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentUpdatedEvent,
  Group,
  Membership,
  Post,
  PostLikedEvent,
} from "@/lib/types";
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  UsersIcon,
  UserRoundMinus,
} from "lucide-react";

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: number }).status;
  }

  return undefined;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }

  return fallback;
}

function getRoleVariant(role: string) {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    OWNER: "default",
    ADMIN: "secondary",
    MEMBER: "outline",
  };

  return variants[role] ?? "outline";
}

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const dispatch = useAppDispatch();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocket();
    socket?.emit("joinGroup", groupId);

    return () => {
      socket?.emit("leaveGroup", groupId);
    };
  }, [groupId, accessToken]);

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocket();
    const rejoin = () => socket?.emit("joinGroup", groupId);
    socket?.on("connect", rejoin);

    return () => {
      socket?.off("connect", rejoin);
    };
  }, [groupId, accessToken]);

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocket();
    const onPostCreated = (post: Post) => {
      if (post.authorId === currentUserId) return;

      dispatch(
        postsApi.util.updateQueryData(
          "getPosts",
          { groupId, page: 1, limit: 10, search: undefined },
          (draft) => {
            if (!draft.some((cachedPost) => cachedPost.id === post.id)) {
              draft.unshift(post);
            }
          },
        ),
      );
    };

    socket?.on("post:created", onPostCreated);

    return () => {
      socket?.off("post:created", onPostCreated);
    };
  }, [groupId, currentUserId, accessToken, dispatch]);

  useEffect(() => {
    if (!groupId) return;

    const socket = getSocket();
    const postsArgs = {
      groupId,
      page: 1,
      limit: 10,
      search: undefined,
    };

    const updatePost = (postId: string, recipe: (post: Post) => void) => {
      dispatch(
        postsApi.util.updateQueryData("getPosts", postsArgs, (draft) => {
          const post = draft.find((item) => item.id === postId);
          if (post) recipe(post);
        }),
      );
    };

    const onPostLiked = (event: PostLikedEvent) => {
      if (event.groupId !== groupId) return;
      updatePost(event.postId, (post) => {
        post.likeCount = event.likeCount;
        if (event.userId === currentUserId) {
          post.likedByMe = event.liked;
        }
      });
    };

    const onCommentCreated = (event: CommentCreatedEvent) => {
      if (event.groupId !== groupId) return;
      updatePost(event.postId, (post) => {
        post.commentCount = (post.commentCount ?? 0) + 1;
      });
      dispatch(
        postsApi.util.updateQueryData(
          "getComments",
          { groupId, postId: event.postId, page: 1, limit: 10 },
          (draft) => {
            if (!draft.items.some((comment) => comment.id === event.comment.id)) {
              draft.items.push(event.comment);
              draft.total += 1;
            }
          },
        ),
      );
    };

    const onCommentUpdated = (event: CommentUpdatedEvent) => {
      if (event.groupId !== groupId) return;
      dispatch(
        postsApi.util.updateQueryData(
          "getComments",
          { groupId, postId: event.postId, page: 1, limit: 10 },
          (draft) => {
            const comment = draft.items.find(
              (item) => item.id === event.comment.id,
            );
            if (comment) {
              Object.assign(comment, event.comment);
            }
          },
        ),
      );
    };

    const onCommentDeleted = (event: CommentDeletedEvent) => {
      if (event.groupId !== groupId) return;
      updatePost(event.postId, (post) => {
        post.commentCount = event.commentCount;
      });
      dispatch(
        postsApi.util.updateQueryData(
          "getComments",
          { groupId, postId: event.postId, page: 1, limit: 10 },
          (draft) => {
            const index = draft.items.findIndex(
              (comment) => comment.id === event.commentId,
            );
            if (index !== -1) {
              draft.items.splice(index, 1);
              draft.total = Math.max(0, draft.total - 1);
            }
          },
        ),
      );
    };

    socket?.on("post:liked", onPostLiked);
    socket?.on("comment:created", onCommentCreated);
    socket?.on("comment:updated", onCommentUpdated);
    socket?.on("comment:deleted", onCommentDeleted);

    return () => {
      socket?.off("post:liked", onPostLiked);
      socket?.off("comment:created", onCommentCreated);
      socket?.off("comment:updated", onCommentUpdated);
      socket?.off("comment:deleted", onCommentDeleted);
    };
  }, [groupId, currentUserId, accessToken, dispatch]);

  const {
    data: group,
    isLoading: isGroupLoading,
    error: groupError,
  } = useGetGroupQuery(groupId ?? "", { skip: !groupId });
  const {
    data: members,
    isLoading: areMembersLoading,
    error: membersError,
  } = useGetGroupMembersQuery(groupId ?? "", { skip: !groupId || !group });

  if (isGroupLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading group...</span>
      </div>
    );
  }

  const groupErrorStatus = getErrorStatus(groupError);

  if (groupErrorStatus === 403) {
    return (
      <GroupError
        title="You can't access this group"
        message="You must be a member of this group to view it."
      />
    );
  }

  if (groupErrorStatus === 404) {
    return (
      <GroupError
        title="Group not found"
        message="This group may have been deleted or the link is incorrect."
      />
    );
  }

  if (groupError || !group) {
    return (
      <GroupError
        title="Unable to load group"
        message="Please try again in a moment."
      />
    );
  }

  return (
    <div className="space-y-6 py-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{group.name}</CardTitle>
          <CardDescription>
            {group.description || "No description provided."}
          </CardDescription>
          {group.joinCode && (
            <CardDescription className="text-sm text-muted-foreground ml-auto">
              Join code: <span className="font-mono">{group.joinCode}</span>
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostsFeed group={group} members={members} />
        </TabsContent>

        <TabsContent value="members">
          <MembersPanel
            members={members}
            isLoading={areMembersLoading}
            error={membersError}
          />
        </TabsContent>

        <TabsContent value="live">
          <LiveRoomsSection groupId={group.id} />
        </TabsContent>

        <TabsContent value="settings">
          <GroupSettings group={group} members={members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupSettings({
  group,
  members,
}: {
  group: Group;
  members?: Membership[];
}) {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentMembership =
    members?.find((membership) => membership.userId === currentUserId) ??
    group.memberships?.find(
      (membership) => membership.userId === currentUserId,
    );
  const role = currentMembership?.role;
  const canManageInvite = role === "OWNER" || role === "ADMIN";
  const isOwner = role === "OWNER";
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [regenerateCode, { isLoading: isRegenerating }] =
    useRegenerateGroupCodeMutation();
  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();

  const inviteLink = `${window.location.origin}/join/${group.joinCode}`;

  const handleCopyInvite = async () => {
    setSettingsError("");
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
    } catch {
      setSettingsError("Unable to copy the invite link.");
    }
  };

  const handleRegenerateCode = async () => {
    setSettingsError("");
    try {
      await regenerateCode(group.id).unwrap();
      setIsRegenerateOpen(false);
      setIsCopied(false);
    } catch (error) {
      setSettingsError(
        getErrorMessage(error, "Unable to regenerate the invite code."),
      );
    }
  };

  const handleLeaveGroup = async () => {
    setSettingsError("");
    try {
      await leaveGroup(group.id).unwrap();
      navigate("/", { replace: true });
    } catch (error) {
      setSettingsError(getErrorMessage(error, "Unable to leave this group."));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group settings</CardTitle>
        <CardDescription>
          Manage invitations and your membership.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settingsError && (
          <Alert variant="destructive">
            <AlertDescription>{settingsError}</AlertDescription>
          </Alert>
        )}

        {canManageInvite && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Invite members</p>
              <p className="text-sm text-muted-foreground">
                Share this code or copy the invite link.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
                {group.joinCode}
              </code>
              <Button variant="outline" onClick={handleCopyInvite}>
                {isCopied ? <Check /> : <Copy />}
                {isCopied ? "Copied" : "Copy invite link"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRegenerateOpen(true)}
                disabled={isRegenerating}
              >
                <RefreshCw />
                Regenerate code
              </Button>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          {isOwner ? (
            <p className="text-sm text-muted-foreground">
              Owners cannot leave their own group.
            </p>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setIsLeaveOpen(true)}
              disabled={isLeaving}
            >
              <UserRoundMinus />
              Leave group
            </Button>
          )}
        </div>
      </CardContent>

      <AlertDialog open={isRegenerateOpen} onOpenChange={setIsRegenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
            <AlertDialogDescription>
              The current invite link will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" />}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
            >
              {isRegenerating && <Loader2 className="animate-spin" />}
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this group and its posts. You can join
              again with an invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel render={<Button variant="outline" />}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" />}
              onClick={handleLeaveGroup}
              disabled={isLeaving}
            >
              {isLeaving && <Loader2 className="animate-spin" />}
              Leave group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function MembersPanel({
  members,
  isLoading,
  error,
}: {
  members?: Array<{
    id: string;
    role: string;
    user: { username: string; email: string };
  }>;
  isLoading: boolean;
  error?: unknown;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading members...</span>
        </CardContent>
      </Card>
    );
  }

  const errorStatus = getErrorStatus(error);

  if (errorStatus === 403) {
    return (
      <GroupError
        title="Members are unavailable"
        message="You must be a member of this group to view its members."
      />
    );
  }

  if (errorStatus === 404) {
    return (
      <GroupError
        title="Group not found"
        message="This group may have been deleted or the link is incorrect."
      />
    );
  }

  if (error) {
    return (
      <GroupError
        title="Unable to load members"
        message="Please try again in a moment."
      />
    );
  }

  if (!members?.length) {
    return (
      <Card>
        <CardContent className="flex min-h-40 flex-col items-center justify-center text-center">
          <UsersIcon className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No members found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>
          {members.length} member{members.length === 1 ? "" : "s"} in this group
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{member.user.username}</p>
              <p className="truncate text-sm text-muted-foreground">
                {member.user.email}
              </p>
            </div>
            <Badge variant={getRoleVariant(member.role)}>{member.role}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function GroupError({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Link
        to="/"
        className="mt-4 inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Back to groups
      </Link>
    </div>
  );
}
