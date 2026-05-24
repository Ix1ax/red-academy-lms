export type Intensive = {
  id: string;
  title: string;
  description: string;
  organizerType: string;
  organizationId?: string | null;
  status: string;
  participantLimit: number;
  startsAt?: string;
  endsAt?: string;
  registrationDeadline?: string | null;
  coverUrl?: string | null;
};
