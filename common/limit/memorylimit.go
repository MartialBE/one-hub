package limit

import (
	"sync"
	"time"
)

// MemoryLimiter is a memory-based rate limiter that implements the RateLimiter interface.
// It can be configured to use either a fixed window or token bucket approach.
type MemoryLimiter struct {
	rate          int           // Maximum requests per window
	rpm           int           // RPM threshold for API limiter
	window        time.Duration // Time window for rate limiting
	burst         int           // Maximum burst size (for token bucket)
	isTokenBucket bool          // Whether to use token bucket approach

	// For fixed window approach
	windowStore map[string]*windowData
	// For token bucket approach
	tokenStore map[string]*tokenData

	mutex sync.RWMutex

	// For cleanup
	cleanupInterval time.Duration
	stopCleanup     chan struct{}
}

// windowData stores data for fixed window rate limiting
type windowData struct {
	count       int       // Current count in the window
	windowStart time.Time // Start time of the current window
	lastUpdated time.Time // Last time this data was updated
}

// tokenData stores data for token bucket rate limiting
type tokenData struct {
	tokens      float64   // Current token count
	lastUpdate  time.Time // Last time tokens were added
	rpm         int       // Current RPM count
	lastMinute  int64     // Last minute timestamp
	counter     int       // Counter for the current minute
	lastUpdated time.Time // Last time this data was updated
}

// NewMemoryLimiter creates a new memory-based rate limiter.
// If useTokenBucket is true, it uses a token bucket approach, otherwise it uses a fixed window approach.
func NewMemoryLimiter(rate int, rpm int, window time.Duration, useTokenBucket bool) *MemoryLimiter {
	limiter := &MemoryLimiter{
		rate:            rate,
		rpm:             rpm,
		window:          window,
		isTokenBucket:   useTokenBucket,
		cleanupInterval: 5 * time.Minute, // Clean up every 5 minutes
		stopCleanup:     make(chan struct{}),
	}

	if useTokenBucket {
		// For token bucket, burst is 10x the rate (same as in api_limiter.go)
		limiter.burst = rate * TokenBurstMultiplier
		limiter.tokenStore = make(map[string]*tokenData)
	} else {
		limiter.windowStore = make(map[string]*windowData)
	}

	// Start cleanup goroutine
	go limiter.cleanup()

	return limiter
}

// Allow checks if a single request is allowed.
func (l *MemoryLimiter) Allow(keyPrefix string) bool {
	return l.AllowN(keyPrefix, 1)
}

// AllowN checks if n requests are allowed.
func (l *MemoryLimiter) AllowN(keyPrefix string, n int) bool {
	if l.isTokenBucket {
		return l.allowTokenBucket(keyPrefix, n)
	}
	return l.allowFixedWindow(keyPrefix, n)
}

// GetCurrentRate returns the current rate for the given key.
func (l *MemoryLimiter) GetCurrentRate(keyPrefix string) (int, error) {
	if l.isTokenBucket {
		return l.getCurrentRateTokenBucket(keyPrefix)
	}
	return l.getCurrentRateFixedWindow(keyPrefix)
}

// allowFixedWindow implements the fixed window approach for rate limiting.
func (l *MemoryLimiter) allowFixedWindow(keyPrefix string, n int) bool {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now()
	data, exists := l.windowStore[keyPrefix]

	if !exists {
		// First request for this key
		l.windowStore[keyPrefix] = &windowData{
			count:       n,
			windowStart: now,
			lastUpdated: now,
		}
		return true
	}

	// Check if we're in a new window
	if now.Sub(data.windowStart) >= l.window {
		// Reset for new window
		data.count = n
		data.windowStart = now
		data.lastUpdated = now
		return true
	}

	// We're in the current window
	if data.count+n <= l.rate {
		// Allow if we haven't exceeded the rate
		data.count += n
		data.lastUpdated = now
		return true
	}

	// Rate exceeded
	return false
}

// getCurrentRateFixedWindow returns the current rate for fixed window approach.
func (l *MemoryLimiter) getCurrentRateFixedWindow(keyPrefix string) (int, error) {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	data, exists := l.windowStore[keyPrefix]
	if !exists {
		return 0, nil
	}

	now := time.Now()
	// If we're in a new window, the current rate is 0
	if now.Sub(data.windowStart) >= l.window {
		return 0, nil
	}

	return data.count, nil
}

// allowTokenBucket implements the token bucket approach for rate limiting.
func (l *MemoryLimiter) allowTokenBucket(keyPrefix string, n int) bool {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now()
	nowUnix := now.Unix()
	nowMinute := nowUnix / 60 * 60 // Round down to the start of the minute

	data, exists := l.tokenStore[keyPrefix]

	if !exists {
		// First request for this key
		data = &tokenData{
			tokens:      float64(l.burst) - float64(n),
			lastUpdate:  now,
			rpm:         0,
			lastMinute:  nowMinute,
			counter:     n,
			lastUpdated: now,
		}
		l.tokenStore[keyPrefix] = data
		return true
	}

	// Add tokens based on time elapsed
	elapsed := now.Sub(data.lastUpdate).Seconds()
	newTokens := elapsed * float64(l.rate)
	data.tokens = minValue(float64(l.burst), data.tokens+newTokens)
	data.lastUpdate = now

	// Update RPM tracking
	if nowMinute > data.lastMinute {
		// We're in a new minute
		data.lastMinute = nowMinute
		data.counter = n
	} else {
		// Same minute, increment counter
		data.counter += n
	}

	// Update RPM (requests in the last minute)
	data.rpm = data.counter

	// Check if we have enough tokens
	if data.tokens >= float64(n) {
		data.tokens -= float64(n)
		data.lastUpdated = now
		return true
	}

	// Not enough tokens
	return false
}

// getCurrentRateTokenBucket returns the current rate for token bucket approach.
func (l *MemoryLimiter) getCurrentRateTokenBucket(keyPrefix string) (int, error) {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	data, exists := l.tokenStore[keyPrefix]
	if !exists {
		return 0, nil
	}

	return data.rpm, nil
}

// cleanup periodically removes expired entries to prevent memory leaks.
func (l *MemoryLimiter) cleanup() {
	ticker := time.NewTicker(l.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			l.removeExpiredEntries()
		case <-l.stopCleanup:
			return
		}
	}
}

// removeExpiredEntries removes entries that haven't been updated in a while.
func (l *MemoryLimiter) removeExpiredEntries() {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now()
	expirationTime := 2 * l.window // Keep entries for twice the window duration

	if l.isTokenBucket {
		for key, data := range l.tokenStore {
			if now.Sub(data.lastUpdated) > expirationTime {
				delete(l.tokenStore, key)
			}
		}
	} else {
		for key, data := range l.windowStore {
			if now.Sub(data.lastUpdated) > expirationTime {
				delete(l.windowStore, key)
			}
		}
	}
}

// Stop stops the cleanup goroutine.
func (l *MemoryLimiter) Stop() {
	close(l.stopCleanup)
}

// minValue returns the minimum of two float64 values.
func minValue(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
