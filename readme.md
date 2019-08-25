#### At this moment in time, this project is in its inception, for the first working prototype, the following is needed:

- [x] connect to a redis instance and read data into an AST structure
- [x] add a configurable type-converter to use the inferred data and matching rules to create conversion DTOs with names, identifyers and relations
- [ ] generate a graphql schema with the types inferred from scanning and configurations
- [ ] resolve Query types
- [ ] add tests as going along

For a basic run through the inital template, there is a `start.ts` script, you can best explore it via debugging in vs code

If your Redis is at 127.0.0.1:6379 and has no AUTH, can just

```sh
yarn install
yarn ts

# now you can debug lib/start.js
```

Otherwise, to override any of these settings, you can use the following .env file:

```
REDIS_HOST=my-redis-free-tier.eu-west-1.compute.amazonaws.com
REDIS_PASS=<goes here>
REDIS_PORT=<defaults to 6379>
```
