FROM nginx:alpine

# Copy the HTML index
COPY index.html /usr/share/nginx/html/index.html

# Copy TypeScript types and services (for reference/development)
COPY src /usr/share/nginx/html/src

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
