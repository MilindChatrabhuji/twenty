import { isNonEmptyString } from '@sniptt/guards';

const SYSTEM_GROUP_KEY = 'system';

export const getDefaultGroupKeys = (jobData: unknown): string[] => {
  const workspaceId = (jobData as { workspaceId?: unknown } | undefined)
    ?.workspaceId;

  return isNonEmptyString(workspaceId)
    ? [`workspace:${workspaceId}`]
    : [SYSTEM_GROUP_KEY];
};
