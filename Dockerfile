# Cosmere Ability Helper — static site served by nginx
FROM nginx:1.27-alpine

# Static assets
COPY index.html styles.css app.js /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/

# nginx serves on 80 by default
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
