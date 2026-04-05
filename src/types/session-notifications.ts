export type SessionNotificationCard = {
  nickname: string;
  brand: string;
  last_four: string;
};

export type SessionNotificationIncoming = {
  id: string;
  createdAt: string;
  card: SessionNotificationCard | null;
};

export type SessionNotificationAccepted = {
  id: string;
  acceptedAt: string;
  card: SessionNotificationCard | null;
};
