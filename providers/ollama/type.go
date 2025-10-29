package ollama

import "time"

type OllamaError struct {
	Error string `json:"error,omitempty"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages,omitempty"`
	Stream   bool      `json:"stream"`
	Format   string    `json:"format,omitempty"`
	Options  Option    `json:"options,omitempty"`
}

type Option struct {
	Temperature *float64 `json:"temperature,omitempty"`
	Seed        *int     `json:"seed,omitempty"`
	TopP        *float64 `json:"top_p,omitempty"`
	TopK        *int     `json:"top_k,omitempty"`
}

type ChatResponse struct {
	OllamaError
	Model           string    `json:"model"`
	CreatedAt       time.Time `json:"created_at"`
	Message         Message   `json:"message,omitempty"`
	Done            bool      `json:"done"`
	EvalCount       int       `json:"eval_count,omitempty"`
	PromptEvalCount int       `json:"prompt_eval_count,omitempty"`
}

type Message struct {
	Role    string   `json:"role,omitempty"`
	Content string   `json:"content,omitempty"`
	Images  []string `json:"images,omitempty"`
}

type EmbeddingRequest struct {
	Model string `json:"model"`
	Input any    `json:"input"`
}

type EmbeddingResponse struct {
	OllamaError
	Model           string      `json:"model,omitempty"`
	Embeddings      [][]float64 `json:"embeddings,omitempty"`
	Embedding       []float64   `json:"embedding,omitempty"`
	TotalDuration   int64       `json:"total_duration,omitempty"`
	LoadDuration    int64       `json:"load_duration,omitempty"`
	PromptEvalCount int         `json:"prompt_eval_count,omitempty"`
}

type ModelListResponse struct {
	Models []ModelInfo `json:"models"`
}
type ModelInfo struct {
	Name       string       `json:"name"`
	Model      string       `json:"model"`
	ModifiedAt time.Time    `json:"modified_at"`
	Size       int64        `json:"size"`
	Digest     string       `json:"digest"`
	Details    ModelDetails `json:"details"`
}
type ModelDetails struct {
	ParentModel       string    `json:"parent_model"`
	Format            string    `json:"format"`
	Family            string    `json:"family"`
	Families          *[]string `json:"families"`
	ParameterSize     string    `json:"parameter_size"`
	QuantizationLevel string    `json:"quantization_level"`
}
