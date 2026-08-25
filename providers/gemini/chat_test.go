package gemini

import (
	"encoding/json"
	"testing"

	"one-api/types"
)

func TestConvertFromChatOpenaiOmitsFunctionStrict(t *testing.T) {
	strict := true
	request := &types.ChatCompletionRequest{
		Model: "gemini-2.0-flash",
		Messages: []types.ChatCompletionMessage{
			{Role: types.ChatMessageRoleUser, Content: "What's the weather in Tokyo?"},
		},
		Tools: []*types.ChatCompletionTool{
			{
				Type: "function",
				Function: types.ChatCompletionFunction{
					Name:        "get_weather",
					Description: "Get the weather for a location",
					Parameters: map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"location": map[string]interface{}{
								"type": "string",
							},
						},
					},
					Strict: &strict,
				},
			},
		},
	}

	geminiRequest, errWithCode := ConvertFromChatOpenai(request)
	if errWithCode != nil {
		t.Fatalf("ConvertFromChatOpenai: %+v", errWithCode)
	}

	body, err := json.Marshal(geminiRequest)
	if err != nil {
		t.Fatalf("marshal gemini request: %v", err)
	}

	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		t.Fatalf("unmarshal gemini request: %v", err)
	}

	tools, ok := payload["tools"].([]any)
	if !ok || len(tools) == 0 {
		t.Fatalf("expected tools in gemini request, got %s", body)
	}
	tool0, ok := tools[0].(map[string]any)
	if !ok {
		t.Fatalf("expected tools[0] object, got %s", body)
	}
	decls, ok := tool0["functionDeclarations"].([]any)
	if !ok || len(decls) == 0 {
		t.Fatalf("expected functionDeclarations, got %s", body)
	}
	decl0, ok := decls[0].(map[string]any)
	if !ok {
		t.Fatalf("expected functionDeclarations[0] object, got %s", body)
	}
	if _, exists := decl0["strict"]; exists {
		t.Fatalf("OpenAI tools[].function.strict must not be forwarded in Gemini functionDeclarations JSON, got %v", decl0)
	}
	if decl0["name"] != "get_weather" {
		t.Fatalf("expected function name get_weather, got %v", decl0["name"])
	}
}

func TestToOpenAIChoiceMapsGeminiFunctionCall(t *testing.T) {
	candidate := GeminiChatCandidate{
		Content: GeminiChatContent{
			Role: "model",
			Parts: []GeminiPart{
				{
					FunctionCall: &GeminiFunctionCall{
						Name: "get_weather",
						Args: map[string]interface{}{"location": "Tokyo"},
					},
				},
			},
		},
	}
	request := &types.ChatCompletionRequest{Model: "gemini-2.0-flash"}

	choice := candidate.ToOpenAIChoice(request)
	if len(choice.Message.ToolCalls) != 1 {
		t.Fatalf("expected Gemini functionCall to map to OpenAI tool_calls, got %+v", choice.Message)
	}
	call := choice.Message.ToolCalls[0]
	if call.Function == nil || call.Function.Name != "get_weather" {
		t.Fatalf("expected tool_calls[0].function.name get_weather, got %+v", call.Function)
	}
	if call.Function.Arguments == "" || !json.Valid([]byte(call.Function.Arguments)) {
		t.Fatalf("expected JSON arguments, got %q", call.Function.Arguments)
	}
	var args map[string]any
	if err := json.Unmarshal([]byte(call.Function.Arguments), &args); err != nil {
		t.Fatalf("unmarshal arguments: %v", err)
	}
	if args["location"] != "Tokyo" {
		t.Fatalf("expected location Tokyo, got %v", args["location"])
	}
}
