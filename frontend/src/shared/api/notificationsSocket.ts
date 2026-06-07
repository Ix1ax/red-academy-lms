import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiUrl } from "./config";

export type SocketNotification = {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
};

type SocketOptions = {
  userId: string;
  organizationId?: string | null;
  token?: string | null;
  onNotification: (notification: SocketNotification) => void;
  onStatusChange?: (connected: boolean) => void;
};

/**
 * Opens a STOMP-over-SockJS connection to the communication-service (proxied at /ws by the gateway)
 * and streams realtime notifications for the current user and their organization.
 *
 * Returns a disposer that tears the connection down.
 */
export function createNotificationsSocket(options: SocketOptions): () => void {
  const { userId, organizationId, token, onNotification, onStatusChange } = options;
  const endpoint = `${apiUrl}/ws`;

  const client = new Client({
    // SockJS needs an absolute or root-relative http(s) URL, not ws://.
    webSocketFactory: () => new SockJS(endpoint) as WebSocket,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  const handle = (frame: IMessage) => {
    try {
      const parsed = JSON.parse(frame.body) as SocketNotification;
      if (parsed && parsed.id) onNotification(parsed);
    } catch {
      // ignore malformed frames
    }
  };

  client.onConnect = () => {
    onStatusChange?.(true);
    client.subscribe(`/queue/users/${userId}/notifications`, handle);
    if (organizationId) {
      client.subscribe(`/topic/organizations/${organizationId}/events`, handle);
    }
  };

  client.onWebSocketClose = () => onStatusChange?.(false);
  client.onStompError = () => onStatusChange?.(false);

  client.activate();

  return () => {
    onStatusChange?.(false);
    void client.deactivate();
  };
}
