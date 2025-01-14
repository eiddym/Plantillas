FROM node:6.14.4-alpine

RUN apk add --no-cache git && \
    npm install -g gulp bower

COPY package.json package-lock.json bower.json .bowerrc ./

RUN npm install \
    && bower install --allow-root

COPY . .

RUN mv src/app/index.constants.js.sample src/app/index.constants.js \
    && mv docker/modules.admin.login-ldap.html src/app/modules/admin/login/modules.admin.login.html \
    && gulp build

## Segundo paso de generacion de la imagen

FROM nginx:1.15.12-alpine

ARG FRONTEND_VERSION=1.4.4

LABEL maintainer="Carlos Remuzzi <cremuzzi@agetic.gob.bo>"
LABEL version=${FRONTEND_VERSION}

ENV BACKEND_URL=http://127.0.0.1:8000

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chown -R nobody:nobody /usr/share/nginx/html
COPY --chown=nobody:nobody --from=0 /dist /usr/share/nginx/html

RUN ln -sf /dev/stdout /tmp/access.log \
    && ln -sf /dev/stderr /tmp/error.log

USER nobody

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
