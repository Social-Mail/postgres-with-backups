#!/bin/sh

set -e

if [ ! -s "/var/lib/postgresql/server.crt" ]; then
    openssl req -new -x509 -days 3650 -nodes \
        -out "/var/lib/postgresql/server.crt" \
        -keyout "/var/lib/postgresql/server.key" \
        -subj "/CN=postgres" \
        -addext "subjectAltName=DNS:localhost,DNS:postgres,IP:127.0.0.1"
fi

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*

echo "================ GENERATED CERTIFICATE ==============="
cat "/var/lib/postgresql/server.crt"
echo "======================================================"

# Ensure proper ownership

echo "Changing Ownership of $PGDATA"

chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

mkdir -p /db/wal/
mkdir -p /db/wal/archives/
chown -R postgres:postgres /db/wal
chown -R postgres:postgres /etc/postgresql/postgresql.conf
chown -R postgres:postgres /etc/postgresql/pg_hba.conf

echo "$BACKUP_ENC_PASSWORD" > /pg-app/.pwd
sha256sum /pg-app/.pwd | head -c 32 > /pg-app/.pwd-hash
rm /pg-app/.pwd
chown -R postgres:postgres /pg-app/.pwd-hash

if [ "$PG_MODE" == "replica" ]; then

    export PGPASSWORD="$PG_REPLICATOR_PASSWORD"

    # Wait until master is ready
    echo "Waiting for master to be ready..."
    until pg_isready -h $PG_MASTER -p 5432 -U $PG_REPLICATOR_USER; do
        echo "Still waiting for master..."
        sleep 2
    done

    # Initialize replica if needed
    if [ ! -s "$PGDATA/PG_VERSION" ]; then
        echo "Running base backup..."
        gosu postgres pg_basebackup -h $PG_MASTER -U $PG_REPLICATOR_USER -D "$PGDATA" -Fp -Xs -P -R
        chmod 700 "$PGDATA"
    fi

else

    if [ -f "$PG_RESTORE/restored.done" ]; then

        # mv $PG_RESTORE "$PG_RESTORE.done"
        echo "DB Restored"
        rm "$PGDATA/recovery.signal"

    fi

    if [ ! -s "$PGDATA/PG_VERSION" ]; then

        if [ ! "$PG_TEST" == "test" ]; then

            echo "Downloading latest backup"

            node /pg-app/index.js --restore

            if [ -f "$PG_RESTORE/restore.sh" ]; then

                echo "Starting Recovery"

                "$PG_RESTORE/restore.sh"

                touch "$PGDATA/recovery.signal"
                touch "$PG_RESTORE/restored.done"

            fi
        fi

    fi

fi

if [ -z "${NODE_TEST}" ]; then
    (

        while true; do

            echo "[Backup] Starting long-running BackupTool service..."
            
            # Run your infinite script (replace 'start' with whatever argument your daemon takes)
            node /pg-app/index.js
            
            echo "[Backup] WARNING: BackupTool exited or crashed! Restarting in 2 seconds..."
            sleep 2

        done
    ) &
fi

if [ -n "${NODE_APP}" ]; then
    (

        set +e

        while true; do

            sleep 2

            echo "[NODE_APP] Starting running App "
            
            # Run your infinite script (replace 'start' with whatever argument your daemon takes)
            node /app/index.js
            
            echo "[Backup] WARNING: BackupTool exited or crashed! Restarting in 2 seconds..."
        done
    ) &
fi

docker-entrypoint.sh "$@"