package minimax

type MiniMaxBaseResp struct {
	BaseResp BaseResp `json:"base_resp"`
}

type BaseResp struct {
	StatusCode int64  `json:"status_code"`
	StatusMsg  string `json:"status_msg"`
}

type SpeechRequest struct {
	Model        string        `json:"model"`
	Text         string        `json:"text"`
	VoiceSetting VoiceSetting  `json:"voice_setting"`
	AudioSetting *AudioSetting `json:"audio_setting"`
}

type VoiceSetting struct {
	Speed     float64  `json:"speed,omitempty"`
	Vol       *float64 `json:"vol,omitempty"`
	VoiceID   string   `json:"voice_id"`
	Emotion   string   `json:"emotion,omitempty"`
	LatexRead bool     `json:"latex_read,omitempty"`
}

type AudioSetting struct {
	SampleRate int64  `json:"sample_rate,omitempty"`
	Bitrate    int64  `json:"bitrate,omitempty"`
	Format     string `json:"format"`
	Channel    int64  `json:"channel,omitempty"`
}

type SpeechResponse struct {
	BaseResp  BaseResp  `json:"base_resp"`
	Data      Data      `json:"data"`
	ExtraInfo ExtraInfo `json:"extra_info"`
}

type Data struct {
	Audio  string `json:"audio"` // hex编码的audio
	Status int    `json:"status"`
}

type ExtraInfo struct {
	AudioLength             int64   `json:"audio_length"`
	AudioSampleRate         int64   `json:"audio_sample_rate"`
	AudioSize               int64   `json:"audio_size"`
	AudioBitrate            int64   `json:"audio_bitrate"`
	WordCount               int64   `json:"word_count"`
	InvisibleCharacterRatio float64 `json:"invisible_character_ratio"`
	AudioFormat             string  `json:"audio_format"`
	UsageCharacters         int     `json:"usage_characters"`
}
