export type Course = {
  id: string;
  title: string;
  description: string;
  authorType: string;
  courseType: "PUBLIC" | "COMPANY";
  organizationId?: string | null;
  level: string;
  durationHours: number;
  status: string;
  coverUrl?: string | null;
  hasCertificate?: boolean;
};
