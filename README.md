# strapi-fluent-client

A fluent Strapi API client on top of Axios and QS

## Installation

```bash
npm install strapi-fluent-client
```

OR:

```bash
yarn add strapi-fluent-client
```

OR:

```bash
pnpm add strapi-fluent-client
```

## Usage

```typescript
import { StrapiClient, StrapiAtomic } from 'strapi-fluent-client';

async function main() {
  const client = new StrapiClient("http://localhost:1337/api", "my-token");

  // Register new user
  const register = await client["users"].query().register({
    username: "john",
    email: "john@lennon.com",
    password: "john123",
  });

  console.log(register);

  // Authenticate user
  const auth = await client["users"].query().auth({
    identifier: "john@lennon.com",
    password: "john123",
  });

  console.log(auth);

  // Get many posts
  const posts = await client["posts"]
    .query()
    .filters({
      title: {
        $contains: "Hello",
      },
    })
    .pagination({ page: 1, pageSize: 10 })
    // .offsetPagination({ start: 0, limit: 10 })
    .sort(["title:asc"])
    .populate(["author"])
    .fields(["title", "author"])
    .locale("en")
    .publicationState("live")
    .findMany();

  console.log(posts);

  // Get one post
  const post = await client['posts'].query().findOne('1');

  console.log(post);

  // Bulk operations
  const bulk = await client["posts"].bulk([
    {
      type: "create",
      data: {
        title: "Hello World",
        content: "This is a test post",
      },
    },
    {
      type: "create",
      data: {
        title: "Hello World 2",
        content: "This is a second test post",
      },
    },
  ]);

  console.log(bulk);

  // Atomic bulk operations *Experimental*
  const atomic = await new StrapiAtomic(
    "http://localhost:1337/api",
    "my-token"
  ).atomic([
    {
      type: "create",
      contentType: "posts",
      data: {
        title: "Hello World",
        content: "This is a test post",
      },
    },
    {
      type: "update",
      contentType: "posts",
      id: "1",
      data: {
        title: "Hello World Updated",
      },
    },
    {
      type: "delete",
      contentType: "posts",
      id: "1",
    },
  ]);

  console.log(atomic);
}

main();
```
