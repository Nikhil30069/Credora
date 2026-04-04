export type ShareRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type CardRow = {
  id: string;
  owner_id: string;
  brand: string;
  last_four: string;
  nickname: string;
  issuer: string | null;
  created_at: string;
};

export type ShareRequestRow = {
  id: string;
  card_id: string;
  requester_id: string;
  owner_id: string;
  status: ShareRequestStatus;
  message: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  created_at: string;
};
