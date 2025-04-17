-- Modify counter logic to ensure it matches the set RPM value
-- KEYS[1] as tokens_key
-- KEYS[2] as timestamp_key
-- KEYS[3] as request_counter_key (for counting requests)
-- KEYS[4] as last_minute_key (for recording the timestamp of the last minute)
-- ARGV[1] as rate (per second rate)
-- ARGV[2] as capacity (bucket capacity)
-- ARGV[3] as now (current timestamp)
-- ARGV[4] as requested (number of tokens requested)
-- ARGV[5] as rpm (actual RPM threshold)

local rate = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])
local actualRate = tonumber(ARGV[5]) -- actual RPM value
local fill_time = capacity/rate
local ttl = math.floor(fill_time*2)
local last_tokens = tonumber(redis.call("get", KEYS[1]))
if last_tokens == nil then
    last_tokens = capacity
end

local last_refreshed = tonumber(redis.call("get", KEYS[2]))
if last_refreshed == nil then
    last_refreshed = 0
end

local delta = math.max(0, now-last_refreshed)
local filled_tokens = math.min(capacity, last_tokens+(delta*rate))
local allowed = filled_tokens >= requested
local new_tokens = filled_tokens
if allowed then
    new_tokens = filled_tokens - requested
    
    -- If the request is allowed, increment the request counter
    -- Get the current counter value
    local request_count = redis.call("get", KEYS[3])
    if request_count == false then
        request_count = 0
    else
        request_count = tonumber(request_count)
    end
    
    -- Get the timestamp of the last minute
    local last_minute = redis.call("get", KEYS[4])
    local current_minute = now - (now % 60)
    
    if last_minute == false then
        -- If there is no record of the last minute, initialize
        last_minute = current_minute
        redis.call("setex", KEYS[4], 120, current_minute) -- set to expire in 2 minutes
        request_count = 1 -- new minute starts, count from 1
    else
        last_minute = tonumber(last_minute)
        if current_minute > last_minute then
            -- Enter a new minute, reset the counter and update the timestamp
            request_count = 1 -- new minute starts, count from 1
            redis.call("setex", KEYS[4], 120, current_minute) -- update timestamp
        else
            -- In the same minute, counter plus 1, but not more than actualRate
            request_count = request_count + 1
        end
    end
    
    -- Update counter
    redis.call("setex", KEYS[3], 120, request_count) -- set to expire in 2 minutes
end

redis.call("setex", KEYS[1], ttl, new_tokens)
redis.call("setex", KEYS[2], ttl, now)

return allowed
