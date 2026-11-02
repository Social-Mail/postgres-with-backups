#!/bin/sh

if [ "$PG_TEST" == "test" ]; then
   echo "test wal-send $1 > $2"
else
    PWD_HASH=content=$(cat "/app/.pwd-hash")
    7z a "$1.7z" "$1" -p$PWD_HASH
    aws s3 cp "$1.7z" "s3://$AWS_S3_BUCKET/$AWS_S3_BUCKET_FOLDER/wal/$2.7z"
    rm "$1.7z"
fi