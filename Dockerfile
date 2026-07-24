FROM nginx:1.27.5-alpine

# Run the gateway with a dedicated, unprivileged account. NGINX needs
# write access to its cache and PID directories even when its master
# process does not run as root.
RUN addgroup -S -g 10001 gateway \
    && adduser -S -D -H -u 10001 -G gateway gateway \
    && mkdir -p /var/cache/nginx /run \
    && chown -R gateway:gateway /var/cache/nginx /run

COPY --chown=gateway:gateway nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=gateway:gateway proxy_params.conf /etc/nginx/proxy_params.conf

USER 10001

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
