#!/bin/bash

# 証明書ディレクトリを作成
CERT_DIR="/etc/nginx/certs"
mkdir -p $CERT_DIR

# 証明書が既に存在する場合はスキップ
if [ -f "$CERT_DIR/server.crt" ] && [ -f "$CERT_DIR/server.key" ]; then
    echo "SSL certificates already exist. Skipping generation."
    exit 0
fi

echo "Generating SSL certificates..."

# server.cnf設定ファイルを作成
cat > $CERT_DIR/server.cnf << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[req_distinguished_name]
C = JP
ST = Tokyo
L = Shinjuku
O = 42Tokyo
OU = Student
CN = localhost
emailAddress = syagi@student.42tokyo.jp

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
EOF

# 楕円曲線秘密鍵を生成（prime256v1を使用）
openssl ecparam -name prime256v1 -genkey -out $CERT_DIR/server.key

# 証明書署名要求（CSR）を生成
openssl req -new -key $CERT_DIR/server.key -out $CERT_DIR/server.csr -config $CERT_DIR/server.cnf

# 自己署名証明書を生成（有効期限365日）
openssl x509 -req -days 365 \
    -in $CERT_DIR/server.csr \
    -signkey $CERT_DIR/server.key \
    -out $CERT_DIR/server.crt \
    -extensions req_ext \
    -extfile $CERT_DIR/server.cnf

# CSRファイルを削除（不要）
rm $CERT_DIR/server.csr $CERT_DIR/server.cnf

# 権限設定 コンテナコピー時に設定するので不要
# chmod 600 $CERT_DIR/server.key
# chmod 644 $CERT_DIR/server.crt

echo "SSL certificates generated successfully!"

# 証明書情報を表示 debug用
# echo "Certificate details:"
# openssl x509 -in $CERT_DIR/server.crt -text -noout | grep -A 2 "Validity\|Subject:"
