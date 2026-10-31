FROM postgis/postgis:18-3.6-alpine

ENV PGDATA=/var/lib/postgresql/18/docker
ENV PG_RESTORE=/cache/restore

RUN apk add --no-cache gosu
RUN apk add --no-cache aws-cli openssl nodejs npm postgresql18-client tini

VOLUME [ "/db/wal", "/var/lib/postgresql/18/docker", "/cache/restore" ]

COPY ./postgres-primary/postgresql.conf /etc/postgresql/postgresql.conf
COPY ./postgres-primary/pg_hba.conf /etc/postgresql/pg_hba.conf

COPY ./postgres-primary/create-user.sh /docker-entrypoint-initdb.d/

WORKDIR /app
COPY ./postgres-primary/entrypoint.sh ./
COPY ./postgres-primary/wal-clean.sh ./
COPY ./postgres-primary/wal-fetch.sh ./
COPY ./postgres-primary/wal-send.sh ./

COPY ./pg-backup/package.json ./
COPY ./pg-backup/package-lock.json ./
COPY ./pg-backup/src ./src
COPY ./pg-backup/index.js ./
COPY ./pg-backup/tsconfig.json ./

RUN npm i
RUN npx tsc

RUN chmod +x ./entrypoint.sh
RUN chmod +x ./wal-send.sh
RUN chmod +x ./wal-fetch.sh
RUN chmod +x ./wal-clean.sh
RUN chmod +x /docker-entrypoint-initdb.d/create-user.sh

ENTRYPOINT [ "/sbin/tini", "--", "/app/entrypoint.sh" ]

CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]