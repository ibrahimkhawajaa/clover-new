"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Mic, Send, Square, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  messageBody: string;
  messageType?: string;
  attachmentPath?: string | null;
  createdAt: string;
};

type Session = {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  status: string;
  durationSeconds?: number | null;
  elapsedSeconds?: number;
};

export function TicketChat({
  ticketId,
  currentUserId,
  role,
  ticketLabel,
}: {
  ticketId: string;
  currentUserId: string;
  role: string;
  ticketLabel: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState<"live" | "polling">("polling");
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());
  const lastCursor = useRef<string>("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoStarted = useRef(false);

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const next = [...prev];
      for (const m of incoming) {
        if (!knownIds.current.has(m.id)) {
          knownIds.current.add(m.id);
          next.push(m);
          if (m.createdAt > lastCursor.current) lastCursor.current = m.createdAt;
        }
      }
      return next;
    });
  }, []);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/sessions`);
    if (!res.ok) return null;
    const data = await res.json();
    setSession(data.session);
    if (data.session?.status === "active") {
      setElapsed(data.session.elapsedSeconds ?? 0);
    }
    return data.session as Session | null;
  }, [ticketId]);

  const startSession = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not start session");
      return null;
    }
    setSession(data.session);
    setElapsed(data.session.elapsedSeconds ?? 0);
    return data.session as Session;
  }, [ticketId]);

  // Initial load + auto-start timer when assistant joins
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/messages`);
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (cancelled) return;
        for (const m of data.messages as Message[]) {
          knownIds.current.add(m.id);
          if (m.createdAt > lastCursor.current) lastCursor.current = m.createdAt;
        }
        setMessages(data.messages);
        setLoading(false);
        const existing = await loadSession();
        if (
          !cancelled &&
          (role === "assistant" || role === "admin") &&
          !autoStarted.current
        ) {
          autoStarted.current = true;
          if (!existing || existing.status !== "active") {
            await startSession();
            toast.success("Chat session timer started");
          }
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          toast.error("Could not load chat");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, role, loadSession, startSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session || session.status !== "active") return;
    const started = new Date(
      session.startedAt.includes("T")
        ? session.startedAt.endsWith("Z")
          ? session.startedAt
          : `${session.startedAt}Z`
        : `${session.startedAt.replace(" ", "T")}Z`
    ).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  // Message polling only (do not hit /sessions here — that was spamming the API)
  useEffect(() => {
    let stopped = false;
    let unauthorized = false;
    const poll = async () => {
      if (stopped || unauthorized) return;
      try {
        const after = lastCursor.current;
        const url = after
          ? `/api/tickets/${ticketId}/messages?after=${encodeURIComponent(after)}`
          : `/api/tickets/${ticketId}/messages`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 401 || res.status === 403) {
          unauthorized = true;
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const incoming = (data.messages as Message[]) ?? [];
          if (incoming.length) {
            const others = incoming.filter((m) => m.senderId !== currentUserId);
            mergeMessages(incoming);
            if (others.length) toast.message(`New message on ${ticketLabel}`);
          }
        }
      } catch {
        /* ignore transient */
      }
    };
    poll();
    const id = setInterval(poll, 2500);
    setConnection("polling");
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [ticketId, currentUserId, ticketLabel, mergeMessages]);

  // Session status: infrequent checks only (feedback / timer sync)
  useEffect(() => {
    if (feedbackSent) return;
    let stopped = false;
    const refreshSession = async () => {
      if (stopped) return;
      try {
        const sRes = await fetch(`/api/tickets/${ticketId}/sessions`, { cache: "no-store" });
        if (sRes.status === 401 || sRes.status === 403) {
          stopped = true;
          return;
        }
        if (!sRes.ok) return;
        const sData = await sRes.json();
        if (sData.session) setSession(sData.session);
      } catch {
        /* ignore */
      }
    };
    refreshSession();
    const id = setInterval(refreshSession, 12_000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [ticketId, feedbackSent]);

  // Best-effort SSE (supplemental)
  useEffect(() => {
    const es = new EventSource(`/api/tickets/${ticketId}/messages/stream`);
    es.addEventListener("ready", () => setConnection("live"));
    es.addEventListener("messages", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { messages: Message[] };
        if (data.messages?.length) mergeMessages(data.messages);
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => {
      setConnection("polling");
      es.close();
    };
    return () => es.close();
  }, [ticketId, mergeMessages]);

  async function sendText() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageBody: text.trim(), messageType: "text" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      mergeMessages([data.message]);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function uploadAndSend(file: File, messageType: "image" | "voice") {
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/uploads", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Upload failed");

      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageBody: messageType === "image" ? "Sent an image" : "Sent a voice message",
          messageType,
          attachmentPath: upData.path,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      mergeMessages([data.message]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSending(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        await uploadAndSend(file, "voice");
      };
      mediaRecorder.current = rec;
      rec.start();
      setRecording(true);
      toast.message("Recording… tap again to send");
    } catch {
      toast.error("Microphone permission denied");
    }
  }

  async function endSession() {
    const res = await fetch(`/api/tickets/${ticketId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end", sessionId: session?.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not end session");
      return;
    }
    setSession(data.session);
    toast.success(
      `Session ended (${formatDuration(data.session.durationSeconds ?? elapsed)}) — operational time, not billable`
    );
    if (role === "client") setShowFeedback(true);
  }

  // Prompt client for feedback when session ends (detected via poll)
  useEffect(() => {
    if (
      role === "client" &&
      session &&
      session.status !== "active" &&
      session.endedAt &&
      !feedbackSent
    ) {
      setShowFeedback(true);
    }
  }, [session, role, feedbackSent]);

  async function submitFeedback() {
    const res = await fetch(`/api/tickets/${ticketId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        comment: feedbackComment || undefined,
        sessionId: session?.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Could not submit feedback");
      return;
    }
    setFeedbackSent(true);
    setShowFeedback(false);
    toast.success("Thank you for your feedback");
  }

  return (
    <div className="flex h-[min(640px,70vh)] flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_8px_32px_rgba(1,45,29,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/40 bg-primary-container px-4 py-3 text-on-primary-container">
        <div>
          <p className="text-sm font-semibold text-primary-fixed">{ticketLabel}</p>
          <p className="text-xs opacity-80">
            {connection === "live" ? "Live" : "Updating…"}
            {session?.status === "active" ? ` · ${formatDuration(elapsed)}` : ""}
          </p>
        </div>
        {(role === "assistant" || role === "admin") && session?.status === "active" && (
          <Button size="sm" variant="secondary" onClick={endSession}>
            End session
          </Button>
        )}
        {role === "client" && session?.status === "active" && (
          <Button size="sm" variant="secondary" onClick={endSession}>
            End & rate
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            Say hello to start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest text-on-surface border border-outline-variant/40"
                }`}
              >
                <p className={`mb-1 text-[11px] ${mine ? "opacity-80" : "text-on-surface-variant"}`}>
                  {m.senderName}
                </p>
                {m.messageType === "image" && m.attachmentPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.attachmentPath}
                    alt="Shared"
                    className="max-h-56 rounded-lg object-contain"
                  />
                ) : m.messageType === "voice" && m.attachmentPath ? (
                  <audio controls src={m.attachmentPath} className="max-w-full" />
                ) : (
                  <p className="whitespace-pre-wrap">{m.messageBody}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showFeedback && role === "client" && !feedbackSent && (
        <div className="border-t border-outline-variant/40 bg-secondary-container/40 p-4">
          <p className="mb-2 text-sm font-semibold text-primary">How was this conversation?</p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                <Star
                  className={`h-6 w-6 ${n <= rating ? "fill-[#ff835e] text-[#ff835e]" : "text-outline-variant"}`}
                />
              </button>
            ))}
          </div>
          <Input
            placeholder="Optional comment"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            className="mb-2"
          />
          <Button size="sm" onClick={submitFeedback}>
            Submit feedback
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-outline-variant/40 bg-surface-container-lowest p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadAndSend(f, "image");
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          aria-label="Send image"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={recording ? "destructive" : "ghost"}
          onClick={() => void toggleRecording()}
          disabled={sending}
          aria-label={recording ? "Stop recording" : "Record voice"}
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="rounded-full"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
        />
        <Button
          size="icon"
          className="rounded-full"
          onClick={() => void sendText()}
          disabled={sending || !text.trim()}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
