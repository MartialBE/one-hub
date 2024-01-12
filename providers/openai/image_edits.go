package openai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/providers/base"
	"one-api/types"
)

type OpenaiImageEditHandler struct {
	base.BaseHandler
	Request *types.ImageEditRequest
}

func (p *OpenAIProvider) CreateImageEdits(request *types.ImageEditRequest) (response *types.ImageResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	openaiHandler := &OpenaiImageEditHandler{
		BaseHandler: base.BaseHandler{
			Usage: p.Usage,
		},
		Request: request,
	}

	resp, errWithCode := openaiHandler.getResponse(p)

	defer resp.Body.Close()

	openaiResponse := &OpenAIProviderImageResponseResponse{}
	err := json.NewDecoder(resp.Body).Decode(openaiResponse)
	if err != nil {
		errWithCode = common.ErrorWrapper(err, "decode_response_body_failed", http.StatusInternalServerError)
		return
	}

	return openaiHandler.convertToOpenai(openaiResponse)
}

func (h *OpenaiImageEditHandler) getResponse(p *OpenAIProvider) (response *http.Response, errWithCode *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(common.RelayModeImagesEdits)
	if errWithCode != nil {
		return nil, errWithCode
	}
	// 获取请求地址
	fullRequestURL := p.GetFullRequestURL(url, h.Request.Model)

	// 获取请求头
	headers := p.GetRequestHeaders()

	var req *http.Request
	var err error
	if p.OriginalModel != h.Request.Model {
		var formBody bytes.Buffer
		builder := p.Requester.CreateFormBuilder(&formBody)
		if err := imagesEditsMultipartForm(h.Request, builder); err != nil {
			return nil, common.ErrorWrapper(err, "create_form_builder_failed", http.StatusInternalServerError)
		}
		req, err = p.Requester.NewRequest(
			http.MethodPost,
			fullRequestURL,
			p.Requester.WithBody(&formBody),
			p.Requester.WithHeader(headers),
			p.Requester.WithContentType(builder.FormDataContentType()))
		req.ContentLength = int64(formBody.Len())
	} else {
		req, err = p.Requester.NewRequest(
			http.MethodPost,
			fullRequestURL,
			p.Requester.WithBody(p.Context.Request.Body),
			p.Requester.WithHeader(headers),
			p.Requester.WithContentType(p.Context.Request.Header.Get("Content-Type")))
		req.ContentLength = p.Context.Request.ContentLength
	}

	if err != nil {
		errWithCode = common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
		return
	}

	return p.Requester.SendRequestRaw(req)
}

func (h *OpenaiImageEditHandler) convertToOpenai(response *OpenAIProviderImageResponseResponse) (openaiResponse *types.ImageResponse, errWithCode *types.OpenAIErrorWithStatusCode) {
	error := ErrorHandle(&response.OpenAIErrorResponse)
	if error != nil {
		errWithCode = &types.OpenAIErrorWithStatusCode{
			OpenAIError: *error,
			StatusCode:  http.StatusBadRequest,
		}
		return
	}

	h.Usage.TotalTokens = h.Usage.PromptTokens

	return &response.ImageResponse, nil
}

func imagesEditsMultipartForm(request *types.ImageEditRequest, b common.FormBuilder) error {
	err := b.CreateFormFile("image", request.Image)
	if err != nil {
		return fmt.Errorf("creating form image: %w", err)
	}

	err = b.WriteField("prompt", request.Prompt)
	if err != nil {
		return fmt.Errorf("writing prompt: %w", err)
	}

	err = b.WriteField("model", request.Model)
	if err != nil {
		return fmt.Errorf("writing model name: %w", err)
	}

	if request.Mask != nil {
		err = b.CreateFormFile("mask", request.Mask)
		if err != nil {
			return fmt.Errorf("writing mask: %w", err)
		}
	}

	if request.ResponseFormat != "" {
		err = b.WriteField("response_format", request.ResponseFormat)
		if err != nil {
			return fmt.Errorf("writing format: %w", err)
		}
	}

	if request.N != 0 {
		err = b.WriteField("n", fmt.Sprintf("%d", request.N))
		if err != nil {
			return fmt.Errorf("writing n: %w", err)
		}
	}

	if request.Size != "" {
		err = b.WriteField("size", request.Size)
		if err != nil {
			return fmt.Errorf("writing size: %w", err)
		}
	}

	if request.User != "" {
		err = b.WriteField("user", request.User)
		if err != nil {
			return fmt.Errorf("writing user: %w", err)
		}
	}

	return b.Close()
}
