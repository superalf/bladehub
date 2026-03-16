import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  karma: number;
  joinedAt: Timestamp;
  listingCount: number;
  postCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  threadCount: number;
  order: number;
}

export interface Thread {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Timestamp;
  lastReplyAt: Timestamp;
  viewCount: number;
  replyCount: number;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
}

export interface Post {
  id: string;
  threadId: string;
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  images: string[];
  createdAt: Timestamp;
  likes: string[];
  isFirstPost: boolean;
}

export type ListingType = "sell" | "swap" | "wanted";
export type ListingCondition = "new" | "like_new" | "good" | "fair" | "poor";
export type ListingStatus = "active" | "sold" | "expired" | "reserved";

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  price?: number;
  condition: ListingCondition;
  category: string;
  location: string;
  images: string[];
  authorUid: string;
  authorName: string;
  authorAvatar?: string;
  status: ListingStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  viewCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage: string;
  lastMessageAt: Timestamp;
  listingId?: string;
  listingTitle?: string;
  unreadCount: Record<string, number>;
}

export interface Review {
  id: string;
  targetUid: string;
  authorUid: string;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  listingId?: string;
  createdAt: Timestamp;
}

export const FORUM_CATEGORIES: Omit<Category, "threadCount">[] = [
  {
    id: "zsebkesek",
    name: "Zsebkések",
    slug: "zsebkesek",
    description: "Hagyományos és modern zsebkések, folding kések",
    icon: "🔪",
    order: 1,
  },
  {
    id: "fix-pengek",
    name: "Fix pengék",
    slug: "fix-pengek",
    description: "Fix pengéjű kések, vadászkések, taktikai kések",
    icon: "⚔️",
    order: 2,
  },
  {
    id: "fejszek-baltak",
    name: "Fejszék & Balták",
    slug: "fejszek-baltak",
    description: "Fejszék, balták, tomahawkok",
    icon: "🪓",
    order: 3,
  },
  {
    id: "multitoolok",
    name: "Multitoolok",
    slug: "multitoolok",
    description: "Leatherman, Victorinox, Gerber és más multitoolok",
    icon: "🛠️",
    order: 4,
  },
  {
    id: "koszorules-karbantartas",
    name: "Köszörülés & Karbantartás",
    slug: "koszorules-karbantartas",
    description: "Élezési technikák, fenőkövek, olajok, ápolás",
    icon: "💎",
    order: 5,
  },
  {
    id: "gyujtes",
    name: "Gyűjtés",
    slug: "gyujtes",
    description: "Limitált kiadások, vintage darabok, kollekciók",
    icon: "🏆",
    order: 6,
  },
  {
    id: "jogi-kerdesek",
    name: "Jogi kérdések",
    slug: "jogi-kerdesek",
    description: "Mi szabad, mi nem — magyarországi jogszabályok",
    icon: "⚖️",
    order: 7,
  },
];

export const LISTING_CATEGORIES = [
  "Zsebkés",
  "Fix pengéjű kés",
  "Fejsze / Balta",
  "Multitool",
  "Fenőkő / Élező",
  "Tok / Kiegészítő",
  "Egyéb",
];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sell: "Eladó",
  swap: "Csere",
  wanted: "Keresett",
};

export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  sell: "bg-green-700 text-green-100",
  swap: "bg-blue-700 text-blue-100",
  wanted: "bg-yellow-700 text-yellow-100",
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: "Új",
  like_new: "Újszerű",
  good: "Jó állapotú",
  fair: "Megfelelő",
  poor: "Kopott",
};

export const HUNGARY_COUNTIES = [
  "Budapest",
  "Baranya",
  "Bács-Kiskun",
  "Békés",
  "Borsod-Abaúj-Zemplén",
  "Csongrád-Csanád",
  "Fejér",
  "Győr-Moson-Sopron",
  "Hajdú-Bihar",
  "Heves",
  "Jász-Nagykun-Szolnok",
  "Komárom-Esztergom",
  "Nógrád",
  "Pest",
  "Somogy",
  "Szabolcs-Szatmár-Bereg",
  "Tolna",
  "Vas",
  "Veszprém",
  "Zala",
];
