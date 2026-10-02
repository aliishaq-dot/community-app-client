import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCreateRoomMutation,
  useGetRoomsQuery,
  useJoinRoomMutation,
} from "@/features/groups/api/roomsApi";
import type { Room } from "@/lib/types";
import { Loader2, Mic } from "lucide-react";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }

  return "Unable to connect to the room.";
}

function isActiveRoom(room: Room) {
  const status = room.status.toUpperCase();
  return status === "LIVE" || status === "ACTIVE";
}

export function LiveRoomsSection({ groupId }: { groupId: string }) {
  const navigate = useNavigate();
  const { data: rooms, isLoading, error } = useGetRoomsQuery({ groupId });
  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [joinRoom, { isLoading: isJoining }] = useJoinRoomMutation();
  const [roomTitle, setRoomTitle] = useState("");
  const [roomError, setRoomError] = useState("");

  const activeRooms = rooms?.filter(isActiveRoom) ?? [];

  const goToRoom = (roomId: string, livekitUrl: string, token: string) => {
    navigate(`/groups/${groupId}/rooms/${roomId}`, {
      state: { livekitUrl, token },
    });
  };

  const handleCreateRoom = async () => {
    setRoomError("");
    const title = roomTitle.trim();
    if (!title) {
      setRoomError("A room title is required.");
      return;
    }

    try {
      const room = await createRoom({ groupId, title }).unwrap();
      goToRoom(room.roomId, room.livekitUrl, room.token);
    } catch (createError) {
      setRoomError(getErrorMessage(createError));
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setRoomError("");
    try {
      const room = await joinRoom({ groupId, roomId }).unwrap();
      goToRoom(roomId, room.livekitUrl, room.token);
    } catch (joinError) {
      setRoomError(getErrorMessage(joinError));
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <CardTitle>Live</CardTitle>
          <CardDescription>
            Join an active conversation in this group.
          </CardDescription>
          <Input
            value={roomTitle}
            onChange={(event) => setRoomTitle(event.target.value)}
            placeholder="Room title"
            maxLength={120}
            disabled={isCreating}
            required
            aria-label="Room title"
          />
        </div>
        <Button
          onClick={handleCreateRoom}
          disabled={isCreating || !roomTitle.trim()}
        >
          {isCreating ? <Loader2 className="animate-spin" /> : <Mic />}
          Go live
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {roomError && (
          <Alert variant="destructive">
            <AlertDescription>{roomError}</AlertDescription>
          </Alert>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live rooms...
          </div>
        )}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription>Unable to load live rooms.</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && activeRooms.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active rooms right now.
          </p>
        )}
        {activeRooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {room.title || room.host.username}
              </p>
              {room.title && (
                <p className="truncate text-sm text-muted-foreground">
                  Hosted by {room.host.username}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => handleJoinRoom(room.id)}
              disabled={isJoining || isCreating}
            >
              {isJoining && <Loader2 className="animate-spin" />}
              Join
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
