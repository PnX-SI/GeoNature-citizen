# STAGE INSTALL NODE_MODULES
FROM node:14 AS builder

COPY ./package.json ./package-lock.json /

RUN npm install
# && npm install --save-dev webpack webpack-cli html-webpack-plugin webpack-dev-server webpack-dev-middleware

# STAGE RUNTIME
FROM builder AS runtime

WORKDIR /app

COPY --from=builder /node_modules ./node_modules
COPY . .

RUN npm run build:i18n-ssr

CMD ["npm", "run", "serve:ssr"]
