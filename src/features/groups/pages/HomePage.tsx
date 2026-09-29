import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useGetMyGroupsQuery,
  useCreateGroupMutation,
  useJoinGroupMutation,
} from "@/features/groups/api/groupsApi";
import { useAuthStore } from "@/app/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UsersIcon, PlusIcon, LogInIcon, Loader2 } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  const { data: groups, isLoading, error, refetch } = useGetMyGroupsQuery();
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    try {
      await createGroup({
        name: createName,
        description: createDescription,
      }).unwrap();
      setCreateName("");
      setCreateDescription("");
      setCreateDialogOpen(false);
      refetch();
    } catch (err: any) {
      setCreateError(err.data?.message || "Failed to create group");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    try {
      const result = await joinGroup({ code: joinCode.toUpperCase() }).unwrap();
      setJoinCode("");
      setJoinDialogOpen(false);
      navigate(`/groups/${result.id}`);
    } catch (err: any) {
      if (err.status === 404) {
        setJoinError("Invalid invite code");
      } else if (err.status === 409) {
        setJoinError("You are already a member of this group");
      } else {
        setJoinError(err.data?.message || "Failed to join group");
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      OWNER: "default",
      ADMIN: "secondary",
      MEMBER: "outline",
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  const getCurrentUserMembership = (group: any) => {
    const userId = useAuthStore.getState().user?.id;
    return group.memberships?.find((m: any) => m.userId === userId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading groups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground">Manage and join communities</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Enter the details for your new group
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="My Community"
                    value={createName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateName(e.target.value)
                    }
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="What's this group about?"
                    value={createDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateDescription(e.target.value)
                    }
                    disabled={isCreating}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isCreating || !createName.trim()}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger>
              <Button variant="outline">
                <LogInIcon className="mr-2 h-4 w-4" />
                Join with Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Join Group with Code</DialogTitle>
                <DialogDescription>
                  Enter the invite code to join a group
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4">
                {joinError && (
                  <Alert variant="destructive">
                    <AlertDescription>{joinError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Invite Code</Label>
                  <Input
                    id="code"
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setJoinCode(e.target.value.toUpperCase())
                    }
                    required
                    maxLength={10}
                    disabled={isJoining}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isJoining || !joinCode.trim()}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Group"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Failed to load groups. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {!groups || groups.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-6">
              Create a new group or join one with an invite code
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                <LogInIcon className="mr-2 h-4 w-4" />
                Join with Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const membership = getCurrentUserMembership(group);
            return (
              <Card
                key={group.id}
                className="hover:shadow-md transition-shadow"
              >
                <Link to={`/groups/${group.id}`} className="block p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{group.name}</h3>
                      <p className="text-muted-foreground">
                        {group.description || "No description"}
                      </p>
                    </div>
                    {membership && getRoleBadge(membership.role)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="h-4 w-4" />
                    <span>{group.memberships?.length || 0} members</span>
                  </div>
                  <div className="mt-4">
                    <Button variant="ghost" className="w-full">
                      Open Group
                    </Button>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
