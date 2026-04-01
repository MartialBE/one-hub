package vertexai

import (
	"net/http"
	"strings"
	"testing"

	"one-api/model"
	"one-api/providers/base"
	"one-api/providers/vertexai/category"
)

func TestGetFullRequestURLUsesAnthropicPublisherForClaude(t *testing.T) {
	provider := &VertexAIProvider{
		BaseProvider: base.BaseProvider{
			Config:  getConfig(),
			Channel: &model.Channel{},
		},
		Region:    "global",
		ProjectID: "opx-platform",
		Category:  &category.Category{Publisher: "anthropic"},
	}

	url := provider.GetFullRequestURL("claude-sonnet-4-6", "rawPredict")

	want := "https://aiplatform.googleapis.com/v1/projects/opx-platform/locations/global/publishers/anthropic/models/claude-sonnet-4-6:rawPredict"
	if url != want {
		t.Fatalf("unexpected url:\nwant: %s\ngot:  %s", want, url)
	}
}

func TestGetFullRequestURLUsesGooglePublisherForGemini(t *testing.T) {
	provider := &VertexAIProvider{
		BaseProvider: base.BaseProvider{
			Config:  getConfig(),
			Channel: &model.Channel{},
		},
		Region:    "us-central1",
		ProjectID: "opx-platform",
		Category:  &category.Category{Publisher: "google"},
	}

	url := provider.GetFullRequestURL("gemini-2.5-pro", "generateContent")

	want := "https://us-central1-aiplatform.googleapis.com/v1/projects/opx-platform/locations/us-central1/publishers/google/models/gemini-2.5-pro:generateContent"
	if url != want {
		t.Fatalf("unexpected url:\nwant: %s\ngot:  %s", want, url)
	}
}

func TestRequestErrorHandlePreservesUpstreamMessage(t *testing.T) {
	resp := &http.Response{
		StatusCode: http.StatusBadRequest,
		Header:     make(http.Header),
		Body:       ioNopCloser("{\"error\":{\"code\":400,\"message\":\"Publisher Model `publishers/anthropic/models/claude-sonnet-4-6` not found.\",\"status\":\"NOT_FOUND\"}}"),
	}

	openAIErr := RequestErrorHandle(nil)(resp)
	if openAIErr == nil {
		t.Fatal("expected error")
	}

	if !strings.Contains(openAIErr.Message, "publishers/anthropic/models/claude-sonnet-4-6") {
		t.Fatalf("expected upstream message to be preserved, got %q", openAIErr.Message)
	}
}

func ioNopCloser(body string) *stringReadCloser {
	return &stringReadCloser{Reader: strings.NewReader(body)}
}

type stringReadCloser struct {
	*strings.Reader
}

func (r *stringReadCloser) Close() error {
	return nil
}
