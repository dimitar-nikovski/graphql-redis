A this moment in time, this project is in its inception, for the first working prototype, the following is needed:

- [x] connect to a redis instance and read data into an AST structure
- [x] add a configurable type-converter to use the inferred data and matching rules to create conversion DTOs with names, identifyers and relations
- [ ] generate a graphql schema with the types inferred from scanning and configurations
- [ ] resolve Query types
- [ ] add tests as going along

For a basic run through the inital template, there is a `start.ts` script.

```sh
yarn install
yarn ts

node lib/start.js
```