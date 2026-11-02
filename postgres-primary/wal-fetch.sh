#!/bin/sh

set -e

if [ "$PG_TEST" == "test" ]; then
   echo "test wal-fetch $1 < $2"
else
    aws s3 cp "s3://$AWS_S3_BUCKET/$AWS_S3_BUCKET_FOLDER/wal/$1.7z" "$2.7z"
    PWD_HASH=content=$(cat "/app/.pwd-hash")
    7z e "$2.7z" -p$PWD_HASH -so > "$2"
    rm "$2.7z"
fi