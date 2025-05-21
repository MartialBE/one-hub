package database

import (
	"github.com/vmihailenco/msgpack/v5"
	"gorm.io/datatypes"
)

type JSONType[T any] struct {
	datatypes.JSONType[T]
}

func (j *JSONType[T]) MarshalMsgpack() ([]byte, error) {
	return msgpack.Marshal(j.Data())
}

func (j *JSONType[T]) UnmarshalMsgpack(data []byte) error {
	var v T
	if err := msgpack.Unmarshal(data, &v); err != nil {
		return err
	}

	j.JSONType = datatypes.NewJSONType(v)
	return nil
}
