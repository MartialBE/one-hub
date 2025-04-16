-- KEYS[1] 作为存储请求时间戳的有序集合key
-- ARGV[1] 作为rate限制
-- ARGV[2] 作为窗口大小(秒)
-- ARGV[3] 作为当前时间戳(秒)
-- ARGV[4] 作为增加的数量

-- 1. 移除窗口外的过期时间戳
local windowStart = tonumber(ARGV[3]) - tonumber(ARGV[2])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', windowStart)

-- 2. 添加当前请求的时间戳(可以添加多个相同的时间戳来表示多个请求)
for i=1,tonumber(ARGV[4]) do
  redis.call('ZADD', KEYS[1], ARGV[3], ARGV[3] .. ":" .. i .. ":" .. redis.call('TIME')[1])
end

-- 3. 设置过期时间（窗口大小的2倍，确保不会提前删除）
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]) * 2)

-- 4. 获取窗口内的请求数量
local count = redis.call('ZCARD', KEYS[1])

-- 5. 判断是否允许请求
return {count <= tonumber(ARGV[1]) and 1 or 0, count} 