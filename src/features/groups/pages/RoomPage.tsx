import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

interface RoomLocationState {
  livekitUrl?: string;
  token?: string;
}

export function RoomPage() {
  const { groupId, roomId } = useParams<{ groupId: string; roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RoomLocationState | null;

  if (!groupId || !roomId || !state?.livekitUrl || !state.token) {
    return <Navigate to={groupId ? `/groups/${groupId}` : "/"} replace />;
  }

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[32rem]">
      <LiveKitRoom
        serverUrl={state.livekitUrl}
        token={state.token}
        connect
        data-lk-theme="default"
        onDisconnected={() => navigate(`/groups/${groupId}`, { replace: true })}
        className="h-full"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
