-- KEYS[1] as count_key
-- ARGV[1] as rate
-- ARGV[2] as window_size (in seconds)
-- ARGV[3] as increment

local count = redis.call('INCRBY', KEYS[1], ARGV[3])
if count == tonumber(ARGV[3]) then
    -- 如果是第一次设置，设置过期时间
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end

return count <= tonumber(ARGV[1]) and 1 or 0