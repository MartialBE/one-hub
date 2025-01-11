package image

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/http"
	"one-api/common/config"
	"strings"
	"sync"

	_ "golang.org/x/image/webp"
)

func GetImageFromUrl(url string) (mimeType string, data string, err error) {
	if strings.HasPrefix(url, "data:") {
		return ParseBase64File(url)
	}

	if !strings.HasPrefix(url, "http") {
		return "", "", errors.New("invalid image url")
	}

	resp, err := RequestFile(url, "base64")
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if config.CFWorkerImageUrl == "" {
		buffer := bytes.NewBuffer(nil)
		_, err = buffer.ReadFrom(resp.Body)
		if err != nil {
			return
		}
		mimeType = resp.Header.Get("Content-Type")
		if mimeType == "application/octet-stream" {
			firstBytes := buffer.Bytes()[:512]
			actualMime := http.DetectContentType(firstBytes)
			mimeType = actualMime
		}
		data = base64.StdEncoding.EncodeToString(buffer.Bytes())
	} else {
		var cfResp *CFResponse
		err = json.NewDecoder(resp.Body).Decode(&cfResp)
		if err != nil {
			return
		}
		mimeType = cfResp.MimeType
		data = cfResp.Data
	}

	return
}

var readerPool = sync.Pool{
	New: func() interface{} {
		return &bytes.Reader{}
	},
}

func GetImageSizeFromBase64(encoded string) (width, height int, err error) {
	if idx := strings.Index(encoded, ","); idx != -1 {
		encoded = encoded[idx+1:]
	}

	// 计算64KB解码后的最大Base64字符串长度
	maxEncodedLen := base64.StdEncoding.EncodedLen(64 * 1024)
	if len(encoded) > maxEncodedLen {
		encoded = encoded[:maxEncodedLen]
	}

	decodedBuf := make([]byte, base64.StdEncoding.DecodedLen(len(encoded)))
	n, err := base64.StdEncoding.Decode(decodedBuf, []byte(encoded))
	if err != nil {
		return 0, 0, err
	}
	decodedBuf = decodedBuf[:n]

	reader := readerPool.Get().(*bytes.Reader)
	defer readerPool.Put(reader)
	reader.Reset(decodedBuf)

	img, _, err := image.DecodeConfig(reader)
	if err != nil {
		return 0, 0, err
	}

	return img.Width, img.Height, nil
}

func GetImageSizeFromUrl(url string) (width, height int, err error) {
	resp, err := RequestFile(url, "get16kb")
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	img, _, err := image.DecodeConfig(resp.Body)
	if err != nil {
		return 0, 0, err
	}
	return img.Width, img.Height, nil
}

func GetImageSize(image string) (width, height int, err error) {

	switch {
	case strings.HasPrefix(image, "data:image/"):
		return GetImageSizeFromBase64(image)
	case strings.HasPrefix(image, "http"):
		return GetImageSizeFromUrl(image)
	default:
		return 0, 0, errors.New("invalid file type, please view request interface")
	}
}

func ParseBase64File(base64Data string) (string, string, error) {
	start := len("data:")
	// 查找 ";base64," 的位置
	base64Index := strings.Index(base64Data, ";base64,")
	if base64Index == -1 {
		return "", "", errors.New("base64 decode failed")
	}

	mimeType := base64Data[start:base64Index]
	base64Data = base64Data[base64Index+len(";base64,"):]
	if base64Data == "" {
		return "", "", errors.New("empty base64 data")
	}

	return mimeType, base64Data, nil
}
