# Kibana Dev Tools Snippets（logstash-* & app-logs*）
## 0. まとめ指定＆下調べ
### 0-1) 2系統まとめてインデックス一覧（テキスト表）
GET _cat/indices/logstash-*,app-logs*?v&s=index:desc

### 0-1b) 2系統まとめてインデックス一覧（JSONで欲しいとき）
GET _cat/indices/logstash-*,app-logs*?v&s=index:desc&format=json

### 0-1c) 欲しい列だけ＆存在しないパターンがあってもエラーにしない
GET _cat/indices/logstash-*,app-logs*?h=health,status,index,docs.count,store.size,pri,rep,creation.date.string&s=index:desc&v&format=json&ignore_unavailable=true&expand_wildcards=all

### 0-2) 主要フィールドの型（衝突の芽チェック）
GET logstash-*,app-logs*/_field_caps
{
  "fields": [
    "@timestamp",
    "http.response.status_code",
    "http.request.method",
    "url.original",
    "user_agent.original",
    "level",
    "message"
  ]
}

## 1. 読み取り用エイリアス（任意）
### 1-1) 2系統を "all-logs" に束ねる
POST _aliases
{
  "actions": [
    { "add": { "index": "logstash-*", "alias": "all-logs" } },
    { "add": { "index": "app-logs*",  "alias": "all-logs" } }
  ]
}

### 1-2) 動作確認（最新1件）
GET all-logs/_search?size=1
{
  "sort": [{ "@timestamp": "desc" }]
}

## 2. よく使う検索・集計
### 2-A) 直近24hのリクエスト量（1分粒度）
GET all-logs/_search
{
  "size": 0,
  "query": { "range": { "@timestamp": { "gte": "now-24h" }}},
  "aggs": {
    "per_min": {
      "date_histogram": { "field": "@timestamp", "fixed_interval": "1m" }
    }
  }
}

### 2-B) ステータスコード内訳（存在するドキュメントのみ対象）
GET logstash-*,app-logs*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "exists": { "field": "http.response.status_code" }},
        { "range":  { "@timestamp": { "gte": "now-24h" }}}
      ]
    }
  },
  "aggs": {
    "by_status": {
      "terms": { "field": "http.response.status_code", "size": 20 }
    }
  }
}

### 2-C) 2系統を同一チャートで比較（Filters 集約）
GET all-logs/_search
{
  "size": 0,
  "query": { "range": { "@timestamp": { "gte": "now-24h" }}},
  "aggs": {
    "by_source": {
      "filters": {
        "filters": {
          "nginx(logstash-*)": { "query_string": { "query": "event.dataset:nginx.access OR _index:logstash-*" } },
          "app(app-logs*)":    { "query_string": { "query": "_index:app-logs*" } }
        }
      },
      "aggs": {
        "per_min": {
          "date_histogram": { "field": "@timestamp", "fixed_interval": "1m" }
        }
      }
    }
  }
}

### 2-D) 上位URL（静的資産 /health 除外）
GET all-logs/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [{ "range": { "@timestamp": { "gte": "now-24h" }}}],
      "must_not": [
        { "wildcard": { "url.original.keyword": "/assets/*" } },
        { "regexp":  { "url.original.keyword": ".*\\.(png|jpg|jpeg|gif|css|js)$" } },
        { "term":    { "url.original.keyword": "/health" } }
      ]
    }
  },
  "aggs": {
    "top_urls": { "terms": { "field": "url.original.keyword", "size": 20 } }
  }
}

### 2-E) メソッド別／UA別カウント
GET all-logs/_search
{
  "size": 0,
  "aggs": {
    "by_method": { "terms": { "field": "http.request.method.keyword", "size": 10 } },
    "by_ua":     { "terms": { "field": "user_agent.original.keyword", "size": 10 } }
  }
}

## 3. アプリログ専用（app-logs*）

### 3-A) レベル別カウント
GET app-logs*/_search
{
  "size": 0,
  "aggs": {
    "by_level": { "terms": { "field": "level", "size": 10 } }
  }
}

### 3-B) 直近のエラー／警告 5件
GET app-logs*/_search
{
  "size": 5,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-24h" }}},
        { "terms": { "level": ["error","warn"] }}
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }],
  "_source": ["@timestamp","level","message","error.*","req.*","res.*"]
}

## 4. マルチサーチで一括確認

POST _msearch
{ "index": "logstash-*" }
{ "size": 0, "aggs": { "by_status": { "terms": { "field": "http.response.status_code", "size": 20 } } } }
{ "index": "app-logs*" }
{ "size": 0, "aggs": { "by_level":  { "terms": { "field": "level", "size": 10 } } } }

## 5. その場しのぎの正規化（runtime_mappings 例）
### ステータスコードを 2xx/3xx/4xx/5xx に分類（存在する時だけ評価）
GET logstash-*,app-logs*/_search
{
  "size": 0,
  "runtime_mappings": {
    "status_class": {
      "type": "keyword",
      "script": """
        def s = doc.containsKey('http.response.status_code') && !doc['http.response.status_code'].empty
          ? doc['http.response.status_code'].value : null;
        if (s == null) emit('unknown');
        else emit(((int)(s / 100)) + "xx");
      """
    }
  },
  "query": { "range": { "@timestamp": { "gte": "now-24h" } } },
  "aggs": {
    "by_class": { "terms": { "field": "status_class", "size": 10 } }
  }
}


## 6. トラブルシュート補助

### 6-A) マッピング確認（直近の日付のインデックス1つだけでOK）
GET logstash-*/_mapping
GET app-logs*/_mapping

### 6-B) 生ドキュメントを確認（最新1件）
GET all-logs/_search?size=1
{
  "sort": [{ "@timestamp": "desc" }],
  "_source": [
    "@timestamp","event.dataset","message","level",
    "http.request.method","http.response.status_code",
    "url.original","user_agent.original"
  ]
}
