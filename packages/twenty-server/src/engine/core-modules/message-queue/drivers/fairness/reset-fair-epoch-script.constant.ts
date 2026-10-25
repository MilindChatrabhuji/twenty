export const RESET_FAIR_EPOCH_SCRIPT = `
redis.call('INCR', KEYS[1])
redis.call('DEL', KEYS[2])

return 1
`;
