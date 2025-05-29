module one-api

// +heroku goVersion go1.18
go 1.24

toolchain go1.24.2

require (
	cloud.google.com/go/iam v1.5.2
	github.com/ThinkInAIXYZ/go-mcp v0.2.14
	github.com/aliyun/aliyun-oss-go-sdk v3.0.2+incompatible
	github.com/anknown/ahocorasick v0.0.0-20190904063843-d75dbd5169c0
	github.com/aws/aws-sdk-go v1.55.7
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.6.10
	github.com/aws/smithy-go v1.22.3
	github.com/bwmarrin/snowflake v0.3.0
	github.com/bytedance/gopkg v0.1.2
	github.com/coocood/freecache v1.2.4
	github.com/coreos/go-oidc/v3 v3.14.1
	github.com/eko/gocache/lib/v4 v4.2.0
	github.com/eko/gocache/store/freecache/v4 v4.2.2
	github.com/eko/gocache/store/redis/v4 v4.2.2
	github.com/gin-contrib/cors v1.7.5
	github.com/gin-contrib/gzip v1.2.3
	github.com/gin-contrib/sessions v1.0.4
	github.com/gin-contrib/static v1.1.5
	github.com/gin-gonic/gin v1.10.1
	github.com/go-co-op/gocron/v2 v2.16.2
	github.com/go-gormigrate/gormigrate/v2 v2.1.4
	github.com/go-playground/validator/v10 v10.26.0
	github.com/golang-jwt/jwt/v5 v5.2.2
	github.com/gomarkdown/markdown v0.0.0-20250311123330-531bef5e742b
	github.com/google/uuid v1.6.0
	github.com/gorilla/websocket v1.5.3
	github.com/mitchellh/mapstructure v1.5.0
	github.com/pkoukk/tiktoken-go v0.1.7
	github.com/prometheus/client_golang v1.22.0
	github.com/redis/go-redis/v9 v9.9.0
	github.com/samber/lo v1.50.0
	github.com/shopspring/decimal v1.4.0
	github.com/smartwalle/alipay/v3 v3.2.25
	github.com/spf13/viper v1.20.1
	github.com/sqids/sqids-go v0.4.1
	github.com/stretchr/testify v1.10.0
	github.com/stripe/stripe-go/v80 v80.2.1
	github.com/vmihailenco/msgpack/v5 v5.4.1
	github.com/wechatpay-apiv3/wechatpay-go v0.2.20
	github.com/wneessen/go-mail v0.6.2
	go.uber.org/zap v1.27.0
	golang.org/x/crypto v0.38.0
	golang.org/x/image v0.27.0
	golang.org/x/oauth2 v0.30.0
	golang.org/x/sync v0.14.0
	google.golang.org/api v0.235.0
	google.golang.org/grpc v1.72.2
	gopkg.in/natefinch/lumberjack.v2 v2.2.1
	gorm.io/driver/mysql v1.5.7
	gorm.io/driver/postgres v1.6.0
	gorm.io/driver/sqlite v1.5.7
	gorm.io/gorm v1.30.0
)

require (
	cloud.google.com/go/auth v0.16.1 // indirect
	cloud.google.com/go/auth/oauth2adapt v0.2.8 // indirect
	cloud.google.com/go/compute/metadata v0.7.0 // indirect
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/anknown/darts v0.0.0-20151216065714-83ff685239e6 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/bytedance/sonic/loader v0.2.4 // indirect
	github.com/cloudwego/base64x v0.1.5 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/fsnotify/fsnotify v1.9.0 // indirect
	github.com/go-jose/go-jose/v4 v4.1.0 // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-viper/mapstructure/v2 v2.2.1 // indirect
	github.com/golang/mock v1.6.0 // indirect
	github.com/google/s2a-go v0.1.9 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.6 // indirect
	github.com/googleapis/gax-go/v2 v2.14.2 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/jonboulle/clockwork v0.5.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/orcaman/concurrent-map/v2 v2.0.1 // indirect
	github.com/prometheus/client_model v0.6.2 // indirect
	github.com/prometheus/common v0.64.0 // indirect
	github.com/prometheus/procfs v0.16.1 // indirect
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/sagikazarmark/locafero v0.9.0 // indirect
	github.com/smartwalle/ncrypto v1.0.4 // indirect
	github.com/smartwalle/ngx v1.0.10 // indirect
	github.com/smartwalle/nsign v1.0.9 // indirect
	github.com/sourcegraph/conc v0.3.0 // indirect
	github.com/spf13/afero v1.14.0 // indirect
	github.com/spf13/cast v1.8.0 // indirect
	github.com/spf13/pflag v1.0.6 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	github.com/tidwall/gjson v1.18.0 // indirect
	github.com/tidwall/match v1.1.1 // indirect
	github.com/tidwall/pretty v1.2.1 // indirect
	github.com/vmihailenco/tagparser/v2 v2.0.0 // indirect
	github.com/yosida95/uritemplate/v3 v3.0.2 // indirect
	go.opentelemetry.io/auto/sdk v1.1.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.61.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.61.0 // indirect
	go.opentelemetry.io/otel v1.36.0 // indirect
	go.opentelemetry.io/otel/metric v1.36.0 // indirect
	go.opentelemetry.io/otel/trace v1.36.0 // indirect
	go.uber.org/mock v0.5.2 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	golang.org/x/exp v0.0.0-20250506013437-ce4c2cf36ca6 // indirect
	golang.org/x/time v0.11.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20250528174236-200df99c418a // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250528174236-200df99c418a // indirect
	google.golang.org/protobuf v1.36.6 // indirect
)

require (
	github.com/PaulSonOfLars/gotgbot/v2 v2.0.0-rc.32
	github.com/bytedance/sonic v1.13.2 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/dlclark/regexp2 v1.11.5 // indirect
	github.com/gabriel-vasile/mimetype v1.4.9 // indirect
	github.com/gin-contrib/sse v1.1.0 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/go-sql-driver/mysql v1.9.2 // indirect
	github.com/goccy/go-json v0.10.5 // indirect
	github.com/gorilla/context v1.1.2 // indirect
	github.com/gorilla/securecookie v1.1.2 // indirect
	github.com/gorilla/sessions v1.4.0 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.7.5 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/cpuid/v2 v2.2.10 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-sqlite3 v1.14.28 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
	github.com/ugorji/go/codec v1.2.14 // indirect
	golang.org/x/arch v0.17.0 // indirect
	golang.org/x/net v0.40.0
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.25.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	gorm.io/datatypes v1.2.5
)
