FROM postgis/postgis:18-3.6-alpine

RUN apk add --no-cache gosu
RUN apk add --no-cache aws-cli openssl

VOLUME [ "/db/wal" ]

COPY ./postgres-primary/postgresql.conf /etc/postgresql/postgresql.conf
COPY ./postgres-primary/pg_hba.conf /etc/postgresql/pg_hba.conf

COPY ./postgres-primary/create-user.sh /docker-entrypoint-initdb.d/

WORKDIR /app
COPY ./postgres-primary/entrypoint.sh ./
COPY ./postgres-primary/wal-clean.sh ./
COPY ./postgres-primary/wal-fetch.sh ./
COPY ./postgres-primary/wal-send.sh ./
RUN chmod +x ./entrypoint.sh
RUN chmod +x ./wal-send.sh
RUN chmod +x ./wal-fetch.sh
RUN chmod +x ./wal-clean.sh
RUN chmod +x /docker-entrypoint-initdb.d/create-user.sh

ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]