package github

type ModelListResponse []ModelInfo

type ModelInfo struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	FriendlyName  string   `json:"friendly_name"`
	ModelVersion  int      `json:"model_version"`
	Publisher     string   `json:"publisher"`
	ModelFamily   string   `json:"model_family"`
	ModelRegistry string   `json:"model_registry"`
	License       string   `json:"license"`
	Task          string   `json:"task"`
	Description   string   `json:"description"`
	Summary       string   `json:"summary"`
	Tags          []string `json:"tags"`
}
