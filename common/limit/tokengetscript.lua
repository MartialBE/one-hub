-- KEYS[1] as tokens_key
-- KEYS[2] as timestamp_key
-- KEYS[3] as request_counter_key (for counting requests)
-- KEYS[4] as last_minute_key (for recording the timestamp of the last minute)
-- ARGV[1] as rate (per second rate)
-- ARGV[2] as capacity (bucket capacity)
-- ARGV[3] as now (current timestamp)
-- ARGV[4] as actualRate (actual RPM setting)

local rate = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local actualRate = tonumber(ARGV[4]) -- actual RPM value
local fill_time = capacity/rate
local ttl = math.floor(fill_time*2)

-- Get the current token count, if the key does not exist, return the maximum capacity (unused)
local last_tokens = redis.call("get", KEYS[1])
if last_tokens == false then
    return {capacity, 0, actualRate} -- Return array: [remaining tokens, current RPM, max allowed RPM]
end
last_tokens = tonumber(last_tokens)

-- Get the last refresh time
local last_refreshed = redis.call("get", KEYS[2])
if last_refreshed == false then
    return {capacity, 0, actualRate} -- Return array: [remaining tokens, current RPM, max allowed RPM]
end
last_refreshed = tonumber(last_refreshed)

-- Calculate the time difference and refill tokens
local delta = math.max(0, now-last_refreshed)
local filled_tokens = math.min(capacity, last_tokens+(delta*rate))

-- Get the current counter value
local request_count = redis.call("get", KEYS[3])
if request_count == false then
    request_count = 0
else
    request_count = tonumber(request_count)
end

-- Get the timestamp of the last minute
local last_minute = redis.call("get", KEYS[4])
if last_minute == false then
    last_minute = now - (now % 60) -- Start time of the current minute
    redis.call("setex", KEYS[4], 120, last_minute) -- Set to expire in 2 minutes
else
    last_minute = tonumber(last_minute)
end

-- Check if entering a new minute
local current_minute = now - (now % 60)
local rpm = request_count

if current_minute > last_minute then
    -- Entering a new minute, reset the counter and update the timestamp
    rpm = 0 -- New minute starts, current RPM is 0
    redis.call("setex", KEYS[3], 120, 0) -- Reset counter, set to expire in 2 minutes
    redis.call("setex", KEYS[4], 120, current_minute) -- Update timestamp
end

-- Return array: [remaining tokens, current RPM, max allowed RPM]
return {filled_tokens, rpm, actualRate} 