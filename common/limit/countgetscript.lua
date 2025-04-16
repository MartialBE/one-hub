-- KEYS[1] as count_key
-- 获取当前计数器的值，如果不存在则返回0
local count = redis.call('GET', KEYS[1])
if count == false then
    return 0
end
return tonumber(count) 