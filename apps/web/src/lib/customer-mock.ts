export type TierId = "bronze" | "silver" | "gold" | "platinum";

export type MockProgram = {
  slug: string;
  name: string;
  initials: string;
  category: string;
  location: string;
  points: number;
  tier: TierId;
};

export type MockActivity = {
  id: string;
  title: string;
  at: string;
  delta: number;
  programSlug?: string;
};

export type MockReward = {
  id: string;
  title: string;
  pointsCost: number;
  status: "available" | "locked";
  tierRequired?: TierId;
  icon: "coffee" | "meal" | "vip";
};

export const mockCustomer = {
  displayName: "Ama Mbarga",
  cardholderName: "AMA MBARGA",
  points: 2840,
  tier: "gold" as TierId,
  qrValue: "jubely:customer:mock-ama-mbarga",
};

export const mockPrograms: MockProgram[] = [
  {
    slug: "chez-mama",
    name: "Chez Mama",
    initials: "CM",
    category: "Restaurant",
    location: "Akwa, Douala",
    points: 2840,
    tier: "gold",
  },
  {
    slug: "pharmexpress",
    name: "PharmExpress",
    initials: "PX",
    category: "Pharmacy",
    location: "Bonanjo, Douala",
    points: 640,
    tier: "silver",
  },
];

export const mockActivities: MockActivity[] = [
  { id: "1", title: "Lunch — Chez Mama", at: "2026-05-19T13:20:00", delta: 120, programSlug: "chez-mama" },
  { id: "2", title: "Reward — Chez Mama", at: "2026-05-18T19:05:00", delta: -200, programSlug: "chez-mama" },
  { id: "3", title: "Purchase — PharmExpress", at: "2026-05-17T10:15:00", delta: 80, programSlug: "pharmexpress" },
  { id: "4", title: "Welcome bonus", at: "2026-05-10T09:00:00", delta: 50 },
];

export const mockRewardsBySlug: Record<string, MockReward[]> = {
  "chez-mama": [
    { id: "r1", title: "Free coffee", pointsCost: 200, status: "available", icon: "coffee" },
    { id: "r2", title: "Free meal", pointsCost: 850, status: "available", icon: "meal" },
    {
      id: "r3",
      title: "VIP Platinum menu",
      pointsCost: 2000,
      status: "locked",
      tierRequired: "platinum",
      icon: "vip",
    },
  ],
  pharmexpress: [
    { id: "p1", title: "10% off skincare", pointsCost: 300, status: "available", icon: "coffee" },
    { id: "p2", title: "Free delivery", pointsCost: 500, status: "locked", tierRequired: "gold", icon: "meal" },
  ],
};

export function getProgramBySlug(slug: string): MockProgram | undefined {
  return mockPrograms.find((p) => p.slug === slug);
}

export function tierIndex(tier: TierId): number {
  const order: TierId[] = ["bronze", "silver", "gold", "platinum"];
  return order.indexOf(tier);
}
