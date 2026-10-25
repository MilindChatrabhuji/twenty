export const FAIR_TAG_SCRIPT = `
local epoch = redis.call('GET', KEYS[1]) or '0'
local tag = tonumber(redis.call('ZSCORE', KEYS[2], 'v') or '0')

for i = 4, #KEYS do
  local raw = redis.call('GET', KEYS[i])

  if raw then
    local clockEpoch, clock = string.match(raw, '^(%d+):(.+)$')

    if clockEpoch == epoch and tonumber(clock) > tag then
      tag = tonumber(clock)
    end
  end
end

for i = 4, #KEYS do
  local weight = tonumber(redis.call('HGET', KEYS[3], ARGV[i - 1]) or '1')

  if weight <= 0 then
    weight = 1
  end

  redis.call('SET', KEYS[i], epoch .. ':' .. (tag + tonumber(ARGV[1]) / weight), 'PX', ARGV[2])
end

return tostring(tag)
`;
