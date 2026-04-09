package relay

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMergeCustomParamsForPreMapping_Delete(t *testing.T) {
	requestMap := map[string]interface{}{
		"model":       "gpt-4",
		"temperature": 0.7,
		"top_p":       1.0,
	}
	customParams := map[string]interface{}{
		"overwrite":   true,
		"temperature": "__delete__",
	}

	result := mergeCustomParamsForPreMapping(requestMap, customParams)

	_, exists := result["temperature"]
	assert.False(t, exists, "temperature should be deleted")
	assert.Equal(t, 1.0, result["top_p"])
}

func TestMergeCustomParamsForPreMapping_DeleteNonExistent(t *testing.T) {
	requestMap := map[string]interface{}{
		"model": "gpt-4",
	}
	customParams := map[string]interface{}{
		"overwrite":   true,
		"temperature": "__delete__",
	}

	result := mergeCustomParamsForPreMapping(requestMap, customParams)

	_, exists := result["temperature"]
	assert.False(t, exists, "deleting a non-existent key should be a no-op")
}

func TestMergeCustomParamsForPreMapping_DeleteDoesNotAffectOtherKeys(t *testing.T) {
	requestMap := map[string]interface{}{
		"model":       "gpt-4",
		"temperature": 0.7,
		"top_p":       1.0,
	}
	customParams := map[string]interface{}{
		"overwrite":   true,
		"temperature": "__delete__",
		"max_tokens":  100,
	}

	result := mergeCustomParamsForPreMapping(requestMap, customParams)

	_, exists := result["temperature"]
	assert.False(t, exists)
	assert.Equal(t, 100, result["max_tokens"])
	assert.Equal(t, 1.0, result["top_p"])
}
