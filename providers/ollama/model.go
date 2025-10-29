package ollama

import (
	"errors"
	"net/http"
)

func (p *OllamaProvider) GetModelList() ([]string, error) {
	fullRequestURL := p.GetFullRequestURL(p.Config.ModelList, "")
	headers := p.GetRequestHeaders()

	req, err := p.Requester.NewRequest(http.MethodGet, fullRequestURL, p.Requester.WithHeader(headers))
	if err != nil {
		return nil, errors.New("new_request_failed")
	}

	response := &ModelListResponse{}
	_, errWithCode := p.Requester.SendRequest(req, response, false)
	if errWithCode != nil {
		return nil, errors.New(errWithCode.Message)
	}

	var modelList []string
	for _, model := range response.Models {
		modelList = append(modelList, model.Model)
	}

	return modelList, nil
}
