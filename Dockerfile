# 阶段一：构建前端
FROM node:18 as frontend-builder

WORKDIR /web
COPY web/package.json web/yarn.lock ./

# 使用yarn代替npm进行依赖安装
RUN yarn install

COPY web/ ./
COPY ./VERSION ./

# 直接使用文件中的VERSION信息进行构建
RUN DISABLE_ESLINT_PLUGIN='true' REACT_APP_VERSION=$(cat VERSION) yarn run build

# 阶段二：构建后端
FROM golang AS backend-builder

ENV GO111MODULE=on \
    CGO_ENABLED=1 \
    GOOS=linux

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=frontend-builder /web/build ./web/build

# 直接在构建命令中使用文件中的VERSION信息
RUN go build -ldflags "-s -w -X 'one-api/common.Version=$(cat VERSION)' -extldflags '-static'" -o one-api

# 阶段三：准备最终镜像
FROM alpine

RUN apk update \
    && apk upgrade \
    && apk add --no-cache ca-certificates tzdata \
    && update-ca-certificates 2>/dev/null || true

COPY --from=backend-builder /build/one-api /

EXPOSE 3000

WORKDIR /data
ENTRYPOINT ["/one-api"]
