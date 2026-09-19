FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

# Remove the stock virtual host and serve this static site with SPA fallback.
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html/

RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    listen [::]:80;' \
    '    server_name _;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '' \
    '    # The generated page refers to assets under this prefix.' \
    '    location ^~ /nav-portal/ {' \
    '        rewrite ^/nav-portal/(.*)$ /$1 break;' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '' \
    '    # Keep the generated favicon URL working.' \
    '    location = /dh/vite.svg {' \
    '        try_files /vite.svg =404;' \
    '    }' \
    '' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
