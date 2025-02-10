package minimax

import (
	"bytes"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"one-api/common"
	"one-api/common/config"
	"one-api/common/utils"
	"one-api/types"
	"strconv"
	"strings"
)

func (p *MiniMaxProvider) GetVoiceMap() map[string][]string {
	defaultVoiceMapping := map[string][]string{
		"alloy":   {"female-chengshu"},
		"echo":    {"male-qn-qingse"},
		"fable":   {"male-qn-jingying"},
		"onyx":    {"presenter_male"},
		"nova":    {"presenter_female"},
		"shimmer": {"audiobook_female_1"},
	}

	if p.Channel.Plugin == nil {
		return defaultVoiceMapping
	}

	customVoiceMapping, ok := p.Channel.Plugin.Data()["voice"]
	if !ok {
		return defaultVoiceMapping
	}

	for key, value := range customVoiceMapping {
		if _, exists := defaultVoiceMapping[key]; !exists {
			continue
		}
		customVoiceValue, isString := value.(string)
		if !isString || customVoiceValue == "" {
			continue
		}
		customizeVoice := strings.Split(customVoiceValue, "|")
		defaultVoiceMapping[key] = customizeVoice
	}

	return defaultVoiceMapping
}

func (p *MiniMaxProvider) getRequestBody(request *types.SpeechAudioRequest) *SpeechRequest {

	var voice, emotion string
	voiceMap := p.GetVoiceMap()
	if voiceMap[request.Voice] != nil {
		voice = voiceMap[request.Voice][0]
		if len(voiceMap[request.Voice]) > 1 {
			emotion = voiceMap[request.Voice][1]
		}
	} else {
		voice = request.Voice
	}

	speechRequest := &SpeechRequest{
		Model: request.Model,
		Text:  request.Input,
		VoiceSetting: VoiceSetting{
			VoiceID: voice,
			Emotion: emotion,
			Speed:   request.Speed,
		},
	}

	// mp3-1-32000-128000
	if request.ResponseFormat != "" {
		formats := strings.Split(request.ResponseFormat, "-")
		speechRequest.AudioSetting = &AudioSetting{
			Format: formats[0],
		}
		if len(formats) > 1 {
			speechRequest.AudioSetting.Channel = utils.String2Int64(formats[1])
		}
		if len(formats) > 2 {
			speechRequest.AudioSetting.SampleRate = utils.String2Int64(formats[2])
		}
		if len(formats) > 3 {
			speechRequest.AudioSetting.Bitrate = utils.String2Int64(formats[3])
		}
	}

	return speechRequest
}

func (p *MiniMaxProvider) CreateSpeech(request *types.SpeechAudioRequest) (*http.Response, *types.OpenAIErrorWithStatusCode) {
	url, errWithCode := p.GetSupportedAPIUri(config.RelayModeAudioSpeech)
	if errWithCode != nil {
		return nil, errWithCode
	}
	fullRequestURL := p.GetFullRequestURL(url, request.Model)
	headers := p.GetRequestHeaders()

	requestBody := p.getRequestBody(request)

	req, err := p.Requester.NewRequest(http.MethodPost, fullRequestURL, p.Requester.WithBody(requestBody), p.Requester.WithHeader(headers))
	if err != nil {
		return nil, common.ErrorWrapper(err, "new_request_failed", http.StatusInternalServerError)
	}
	defer req.Body.Close()

	speechResponse := &SpeechResponse{}
	_, errWithCode = p.Requester.SendRequest(req, speechResponse, false)
	if errWithCode != nil {
		return nil, errWithCode
	}

	if speechResponse.BaseResp.StatusCode != 0 {
		return nil, common.ErrorWrapper(errors.New(speechResponse.BaseResp.StatusMsg), "speech_error", http.StatusInternalServerError)
	}

	audioBytes, err := hex.DecodeString(speechResponse.Data.Audio)
	if err != nil {
		return nil, common.ErrorWrapper(err, "decode_audio_data_failed", http.StatusInternalServerError)
	}

	body := io.NopCloser(bytes.NewReader(audioBytes))

	response := &http.Response{
		Status:     "200 OK",
		StatusCode: 200,
		Body:       body,
		Header:     make(http.Header),
	}

	response.Header.Set("Content-Type", "audio/"+speechResponse.ExtraInfo.AudioFormat) // 例如 "audio/wav"
	response.Header.Set("Content-Length", strconv.FormatInt(speechResponse.ExtraInfo.AudioSize, 10))

	p.Usage.PromptTokens = speechResponse.ExtraInfo.UsageCharacters
	p.Usage.TotalTokens = speechResponse.ExtraInfo.UsageCharacters

	return response, nil
}
