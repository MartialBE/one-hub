package azure

import (
	"errors"
	"net/http"
	"strings"
)

func (p *AzureProvider) GetModelList() ([]string, error) {
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
	for _, model := range response.Data {
		modelId := strings.Replace(model.Id, `gpt-35`, `gpt-3.5`, 1)
		modelList = append(modelList, modelId)
	}
	return modelList, nil
}
