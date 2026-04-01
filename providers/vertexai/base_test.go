package vertexai

import (
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
