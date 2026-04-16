export type ShareRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type AssetType = "credit_card" | "netflix" | "prime" | "spotify" | "jiohotstar" | "other";

export type CardRow = {
  id: string;
  owner_id: string;
  asset_type: AssetType;
  brand: string;
  last_four: string | null;
  nickname: string;
  issuer: string | null;
  plan_tier: string | null;
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

export const ASSET_META: Record<AssetType, { label: string; icon: string; color: string }> = {
  credit_card: { label: "Credit Card", icon: "💳", color: "bg-blue-100 text-blue-800 ring-blue-200" },
  netflix: { label: "Netflix", icon: "🎬", color: "bg-red-100 text-red-800 ring-red-200" },
  prime: { label: "Amazon Prime", icon: "📦", color: "bg-amber-100 text-amber-800 ring-amber-200" },
  spotify: { label: "Spotify", icon: "🎵", color: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  jiohotstar: { label: "JioHotstar", icon: "🏏", color: "bg-purple-100 text-purple-800 ring-purple-200" },
  other: { label: "Other", icon: "📱", color: "bg-zinc-100 text-zinc-800 ring-zinc-200" },
};
