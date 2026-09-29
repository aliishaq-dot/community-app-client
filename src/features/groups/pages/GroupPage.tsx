import { Link, useParams } from "react-router-dom";
import {
  useGetGroupMembersQuery,
  useGetGroupQuery,
} from "@/features/groups/api/groupsApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UsersIcon } from "lucide-react";

function getErrorStatus(error: unknown) {
  if (error && typeof error === "object" && "status" in error) {
    return (error as { status?: number }).status;
  }

  return undefined;
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
        </CardHeader>
      </Card>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center text-center">
              <div>
                <h2 className="font-medium">Posts are coming soon</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The group feed will be available in the next phase.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <MembersPanel
            members={members}
            isLoading={areMembersLoading}
            error={membersError}
          />
        </TabsContent>
      </Tabs>
    </div>
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
