FROM node:14.18.2-alpine
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache tzdata \
    && cp -r -f /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /svr/app
COPY . .

RUN yarn

ENV NODE_ENV production
ENV HOST=0.0.0.0
ENV PORT=3456

EXPOSE 3456
CMD [ "node", "bin/www" ]
