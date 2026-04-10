FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY backend ./backend
COPY cse ./cse
COPY css ./css
COPY dist ./dist
COPY docs ./docs
COPY images ./images
COPY utilities ./utilities
COPY index.html index.js ./

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
