FROM alpine:latest
RUN apk add --update nodejs
RUN apk add --update npm
ADD ./* front/
WORKDIR front/
RUN npm i
