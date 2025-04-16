-- KEYS[1] 作为存储请求时间戳的有序集合key
-- ARGV[1] 作为窗口大小(秒)
-- ARGV[2] 作为当前时间戳(秒)

-- 1. 移除窗口外的过期时间戳
local windowStart = tonumber(ARGV[2]) - tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', windowStart)

-- 2. 获取窗口内的请求数量
local count = redis.call('ZCARD', KEYS[1])

-- 3. 返回当前窗口内的请求数量
return count 