-- KEYS[1] as tokens_key
-- KEYS[2] as timestamp_key
-- ARGV[1] as rate
-- ARGV[2] as capacity
-- ARGV[3] as now
local rate = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local fill_time = capacity/rate
local ttl = math.floor(fill_time*2)

-- 获取当前令牌数量，如果键不存在则返回最大容量（未使用）
local last_tokens = redis.call("get", KEYS[1])
if last_tokens == false then
    return capacity
end
last_tokens = tonumber(last_tokens)

-- 获取上次刷新时间
local last_refreshed = redis.call("get", KEYS[2])
if last_refreshed == false then
    return capacity
end
last_refreshed = tonumber(last_refreshed)

-- 计算时间差并补充令牌
local delta = math.max(0, now-last_refreshed)
local filled_tokens = math.min(capacity, last_tokens+(delta*rate))

-- 返回当前可用的令牌数
return filled_tokens 