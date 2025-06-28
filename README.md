# ft-transcendence

## 開発者向け

### 前提条件
- [asdf](https://asdf-vm.com/ja-jp/) がインストールされていること

### セットアップ

```
make setup
```

```
cp .env.development .env
make db.migrate
```

### 起動

```
make client.run
```
