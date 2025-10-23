# ft-transcendence

## 開発者向け

### 前提条件
- [asdf](https://asdf-vm.com/ja-jp/) がインストールされていること

### セットアップ

```
make setup
```

```
cp .env.sample .env
cp .vscode/settings.sample.json .vscode/settings.json
```

```
make db.migrate
```

### 起動

```
make run
```

### 本番環境の起動
secretsに下記からダウンロードしたファイルを配置
https://drive.google.com/drive/folders/1a2XRDlH1MCFujg7y0TehT9UEzhznep22

- app_cookie_secret.txt
- grafana_admin_password.txt

サーバーの起動
```
make up
```

サイト
https://localhost:4443
