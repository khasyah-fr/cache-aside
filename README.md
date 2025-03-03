# Cache Aside Implementation

This repository is a cache-aside caching strategy implementation using Redis, Postgres, and Node.js

1. Setup the dependencies
`npm install`

2. Fill the env variables
`nano .env`

3. Run the server
`node server.js`

4. Run the client
`node client.js`

The first endpoint call should've went through PostgreSQL and the second one should've went through Redis.
