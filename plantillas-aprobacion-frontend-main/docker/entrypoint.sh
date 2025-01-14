#!/bin/sh

set -e

sed -i -e 's/src=maps\//src=/g' /usr/share/nginx/html/index.html
sed -i -e 's/.js.map/.js/g' /usr/share/nginx/html/index.html
find /usr/share/nginx/html/ -type f -exec sed -i "s~BACKEND\_URL~${BACKEND_URL}~g" {} \;

exec "$@"
