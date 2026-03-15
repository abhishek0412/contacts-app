#!/bin/sh
# Substitute env vars in nginx config template, then start nginx
envsubst '${API_PROXY_PASS}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
