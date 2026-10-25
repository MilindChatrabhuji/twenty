const TIER_RANGE = 2 ** 19;
const MAX_TIER = 3;

export const computeFairPriority = ({
  tier,
  tag,
}: {
  tier: number;
  tag: number;
}): number => {
  const boundedTier = Math.min(MAX_TIER, Math.max(0, Math.floor(tier)));
  const boundedTag = Math.min(TIER_RANGE - 2, Math.max(0, Math.floor(tag)));

  return 1 + boundedTier * TIER_RANGE + boundedTag;
};
