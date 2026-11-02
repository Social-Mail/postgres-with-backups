#!/bin/sh

if [ "$PG_TEST" == "test" ]; then
   echo "test wal-send $1 > $2"
else
    PWD_HASH=content=$(cat "/app/.pwd-hash")
    aws s3 cp "$1.7z" "s3://$AWS_S3_BUCKET/$AWS_S3_BUCKET_FOLDER/wal/$2.7z"
    7z a "$2.7z" "$2" -p$PWD_HASH
    rm "$1.7z"
fi