package relay

import (
	"encoding/json"
	"fmt"
	"one-api/common/search"
	providersBase "one-api/providers/base"
	"one-api/relay/relay_util"
	"one-api/types"
	"time"

	"github.com/gin-gonic/gin"
)

// 来自 https://github.com/deepseek-ai/DeepSeek-R1?tab=readme-ov-file#official-prompts
const search_template = `# 以下内容是基于用户发送的消息的搜索结果:
%s
在我给你的搜索结果中，每个结果都是[webpage X begin]...[webpage X end]格式的，X代表每篇文章的数字索引。你的输出必须严格按照markdown的格式，请在答案中对应部分引用上下文。如果一句话源自多个上下文，请列出所有相关的引用编号，例如[【1】](url)[【5】](url)，切记不要将引用集中在最后返回引用编号，而是在答案对应部分列出。答案最后有引用列表，引用列表的格式为：
[【1】 标题](url)
[【2】 标题](url)
[【3】 标题](url)
在回答时，请注意以下几点：
- 今天是%s。
- 并非搜索结果的所有内容都与用户的问题密切相关，你需要结合问题，对搜索结果进行甄别、筛选。
- 对于列举类的问题（如列举所有航班信息），尽量将答案控制在10个要点以内，并告诉用户可以查看搜索来源、获得完整信息。优先提供信息完整、最相关的列举项；如非必要，不要主动告诉用户搜索结果未提供的内容。
- 对于创作类的问题（如写论文），请务必在正文的段落中引用对应的参考编号，不能只在文章末尾引用。你需要解读并概括用户的题目要求，选择合适的格式，充分利用搜索结果并抽取重要信息，生成符合用户要求、极具思想深度、富有创造力与专业性的答案。你的创作篇幅需要尽可能延长，对于每一个要点的论述要推测用户的意图，给出尽可能多角度的回答要点，且务必信息量大、论述详尽。
- 如果回答很长，请尽量结构化、分段落总结。如果需要分点作答，尽量控制在5个点以内，并合并相关的内容。
- 对于客观类的问答，如果问题的答案非常简短，可以适当补充一到两句相关信息，以丰富内容。
- 你需要根据用户要求和回答内容选择合适、美观的回答格式，确保可读性强。
- 你的回答应该综合多个相关网页来回答，不能重复引用一个网页。
- 除非用户要求，否则你回答的语言需要和用户提问的语言保持一致。

# 用户消息为：
%s`

func handleSearch(c *gin.Context, request *types.ChatCompletionRequest) {
	if !search.IsEnable() || request == nil || len(request.Messages) == 0 {
		return
	}

	msgLen := len(request.Messages)
	lastMsg := request.Messages[msgLen-1]

	// 检查最后一条消息是否为用户消息
	if lastMsg.Role != types.ChatMessageRoleUser {
		return
	}

	// 提取用户消息内容
	userMsg := extractUserMessages(request.Messages, msgLen)
	if userMsg == "" {
		return
	}

	// 创建查询请求
	queryModel := "gpt-4o-mini"
	queryRequest := createSearchQueryRequest(userMsg, queryModel)

	// 获取提供者并执行查询
	provider, _, fail := GetProvider(c, queryModel)
	if fail != nil {
		return
	}

	chatProvider, ok := provider.(providersBase.ChatInterface)
	if !ok {
		return
	}

	// 执行查询并处理结果
	queryKeyword, err := executeQuery(c, chatProvider, queryRequest, queryModel)
	if err != nil || queryKeyword == "" {
		return
	}

	// 执行搜索
	searchResults, err := performSearch(queryKeyword)
	if err != nil || searchResults == "" {
		return
	}

	// 更新请求消息
	request.Messages[msgLen-1].Content = fmt.Sprintf(search_template,
		searchResults,
		time.Now().Format("2006-01-02 15:04:05"),
		userMsg)
}

// 提取用户消息
func extractUserMessages(messages []types.ChatCompletionMessage, msgLen int) string {
	userMsg := ""

	// 取最后两条消息
	lastTwoIndex := msgLen - 2
	if lastTwoIndex < 0 {
		lastTwoIndex = 0
	}

	for i := lastTwoIndex; i < msgLen; i++ {
		msg := messages[i].ParseContent()
		for _, part := range msg {
			if part.Type == types.ContentTypeText {
				userMsg += fmt.Sprintf("%s: %s\n", messages[i].Role, part.Text)
			}
		}
	}

	return userMsg
}

// 创建搜索查询请求
func createSearchQueryRequest(userMsg, model string) *types.ChatCompletionRequest {
	return &types.ChatCompletionRequest{
		Model: model,
		Messages: []types.ChatCompletionMessage{
			{
				Role:    "system",
				Content: fmt.Sprintf("当前时间:%v，你是一个联网搜索机器人，你需要判断下面的对话是否需要使用搜索引擎。 如果需要，请使用工具进行搜索，你检索的语言需要和用户对话的语言保持一致，如果不需要，请直接返回数字0", time.Now().Format("2006-01-02 15:04:05")),
			},
			{
				Role:    "user",
				Content: userMsg,
			},
		},
		Tools: []*types.ChatCompletionTool{
			{
				Type: "function",
				Function: types.ChatCompletionFunction{
					Name:        "search",
					Description: "Searches the web for information.\\n\\n    Args:\\n        query: keyword to search for",
					Parameters: map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"query": map[string]interface{}{
								"type": "string",
							},
						},
						"required": []string{"query"},
					},
				},
			},
		},
	}
}

// 执行查询
func executeQuery(c *gin.Context, chatProvider providersBase.ChatInterface, queryRequest *types.ChatCompletionRequest, model string) (string, error) {
	usage := &types.Usage{}
	chatProvider.SetUsage(usage)

	response, opErr := chatProvider.CreateChatCompletion(queryRequest)
	if opErr != nil {
		return "", opErr
	}

	// 处理配额
	quota := relay_util.NewQuota(c, model, 0)
	if opErr = quota.PreQuotaConsumption(); opErr != nil {
		return "", opErr
	}
	quota.Consume(c, usage, false)

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	// 提取查询关键词
	choices := response.Choices[0]
	if choices.Message.ToolCalls == nil {
		return "", nil
	}

	toolCall := choices.Message.ToolCalls[0]
	queryMap := make(map[string]string)
	if jsonErr := json.Unmarshal([]byte(toolCall.Function.Arguments), &queryMap); jsonErr != nil {
		return "", jsonErr
	}

	return queryMap["query"], nil
}

// 执行搜索
func performSearch(queryKeyword string) (string, error) {
	s, err := search.Query(queryKeyword)
	if err != nil {

		return "", err
	}

	return s.ToString(), nil
}
