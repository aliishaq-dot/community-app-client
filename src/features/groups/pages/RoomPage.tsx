import {
  LiveKitRoom,
  useRemoteParticipants,
  useTranscriptions,
  VideoConference,
} from "@livekit/components-react";
import { Captions } from "lucide-react";
import { ParticipantKind } from "livekit-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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

function LiveCaptions() {
  const transcriptions = useTranscriptions();
  const participants = useRemoteParticipants();
  const humanParticipants = useMemo(
    () =>
      participants.filter(
        (participant) => participant.kind !== ParticipantKind.AGENT,
      ),
    [participants],
  );
  const [now, setNow] = useState(() => Date.now());
  const [captions, setCaptions] = useState<
    Map<string, { identity: string; name: string; text: string; updatedAt: number }>
  >(new Map());
  const latestStreamIds = useRef(new Map<string, string>());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const latest = new Map<
      string,
      { identity: string; name: string; text: string; streamId: string }
    >();

    for (const transcription of transcriptions) {
      if (!transcription.text.trim()) continue;
      const identity = transcription.participantInfo.identity;
      latest.set(identity, {
        identity,
        name:
          humanParticipants.find((participant) => participant.identity === identity)
            ?.name || identity,
        text: transcription.text,
        streamId: transcription.streamInfo.id,
      });
    }

    const timestamp = Date.now();
    setCaptions((current) => {
      const next = new Map(current);
      for (const caption of latest.values()) {
        const previous = next.get(caption.identity);
        if (
          latestStreamIds.current.get(caption.identity) !== caption.streamId ||
          previous?.text !== caption.text
        ) {
          latestStreamIds.current.set(caption.identity, caption.streamId);
          next.set(caption.identity, {
            ...caption,
            updatedAt: timestamp,
          });
        }
      }
      return next;
    });
  }, [humanParticipants, transcriptions]);

  const visibleCaptions = [...captions.values()].filter(
    (caption) => now - caption.updatedAt < 5000,
  );

  if (visibleCaptions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-20 z-10 flex flex-col items-center gap-2">
      {visibleCaptions.map((caption) => (
        <div
          className="max-w-3xl rounded-md bg-black/75 px-3 py-2 text-center text-sm text-white shadow-lg"
          key={caption.identity}
        >
          <span className="mr-2 font-semibold text-white/70">{caption.name}</span>
          {caption.text}
        </div>
      ))}
    </div>
  );
}

function RoomCall() {
  const [captionsEnabled, setCaptionsEnabled] = useState(true);

  return (
    <div className="relative h-full">
      <VideoConference />
      {captionsEnabled && <LiveCaptions />}
      <Button
        aria-label={captionsEnabled ? "Turn captions off" : "Turn captions on"}
        className="absolute bottom-4 right-4 z-20"
        onClick={() => setCaptionsEnabled((enabled) => !enabled)}
        size="icon"
        variant={captionsEnabled ? "default" : "outline"}
      >
        <Captions />
      </Button>
    </div>
  );
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
        <RoomCall />
      </LiveKitRoom>
    </div>
  );
}
