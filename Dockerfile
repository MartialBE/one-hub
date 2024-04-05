# 前端构建阶段
FROM node:18 as frontend-builder

WORKDIR /web
COPY web/package.json ./

RUN npm install --fetch-timeout=120000

COPY web/ ./

RUN npm config set registry https://registry.npm.taobao.org && npm run build


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

# 修改构建命令，移除关于VERSION的引用
RUN go build -ldflags "-s -w -extldflags '-static'" -o one-api

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
