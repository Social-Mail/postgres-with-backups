#!/bin/sh

if [ "$PG_TEST" == "test" ]; then
   echo "test wal-send $1 > $2"
else
    gzip -c "$1" > "$1.gz"
    openssl enc -aes-256-cbc -pbkdf2 -in "$1.gz" -out "$1.gz.enc" -pass file:/app/.pwd-hash
    aws s3 cp "$1.gz.enc" "s3://$AWS_S3_BUCKET/$AWS_S3_BUCKET_FOLDER/wal/$2.gz.enc"
    rm "$1.gz.enc"
    rm "$1.gz"
fi