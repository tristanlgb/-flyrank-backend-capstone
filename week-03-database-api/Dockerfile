FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY week-03-database-api/package.json week-03-database-api/package.json
COPY week-02-task-api/package.json week-02-task-api/package.json
RUN npm install --workspace week-03-database-api
COPY week-03-database-api week-03-database-api
COPY week-02-task-api/src/openapi.js week-02-task-api/src/openapi.js
CMD ["npm", "start", "-w", "week-03-database-api"]
