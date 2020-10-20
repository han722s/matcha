FROM alpine:latest
RUN apk add --update nodejs
RUN apk add --update npm
ADD ./* api/
WORKDIR api/
RUN npm i
