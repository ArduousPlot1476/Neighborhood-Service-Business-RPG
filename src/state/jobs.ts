export type JobStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'failed';

export type JobQuality = 'unfinished' | 'rough' | 'solid' | 'pristine';

export interface JobRecord {
  readonly id: string;
  readonly accountId: string;
  readonly npcId: string;
  readonly servicePlanId: string;
  readonly scheduledDay: number;
  status: JobStatus;
  quality: JobQuality | null;
  qualityScore: number | null;
  payoutCents: number | null;
  zonesCleared: number;
  zonesTotal: number;
  startedTick: number | null;
  completedTick: number | null;
}

export function createScheduledJob(args: {
  id: string;
  accountId: string;
  npcId: string;
  servicePlanId: string;
  scheduledDay: number;
  zonesTotal: number;
}): JobRecord {
  return {
    id: args.id,
    accountId: args.accountId,
    npcId: args.npcId,
    servicePlanId: args.servicePlanId,
    scheduledDay: args.scheduledDay,
    status: 'scheduled',
    quality: null,
    qualityScore: null,
    payoutCents: null,
    zonesCleared: 0,
    zonesTotal: args.zonesTotal,
    startedTick: null,
    completedTick: null,
  };
}

export const JOB_STATUS_LABEL: Readonly<Record<JobStatus, string>> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  missed: 'Missed',
  failed: 'Did not finish',
};

export const JOB_STATUS_COLOR: Readonly<Record<JobStatus, number>> = {
  scheduled: 0xd4a019,
  in_progress: 0x6aa8d9,
  completed: 0x5a8a3a,
  missed: 0xa23a1c,
  failed: 0xa23a1c,
};

export const JOB_QUALITY_LABEL: Readonly<Record<JobQuality, string>> = {
  unfinished: 'Unfinished',
  rough: 'Rough',
  solid: 'Solid',
  pristine: 'Pristine',
};

export function qualityFromScore(score: number): JobQuality {
  if (score <= 0.05) return 'unfinished';
  if (score < 0.6) return 'rough';
  if (score < 0.95) return 'solid';
  return 'pristine';
}
