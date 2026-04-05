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
  amount: number | null;
  purpose: string | null;
  platform: string | null;
  created_at: string;
  updated_at?: string;
  owner_phone_visible?: boolean;
  requester_phone_visible?: boolean;
};

export type ProfileRow = {
  id: string;
  email: string;
  domain: string;
  created_at: string;
  signup_card_bin_verified_at: string | null;
  full_name?: string | null;
  phone?: string | null;
};
