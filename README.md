<h1 align="center">
  <sup>zod-request</sup>
  <br>
  <a href="https://github.com/shahradelahi/zod-request/actions/workflows/ci.yml"><img src="https://github.com/shahradelahi/zod-request/actions/workflows/ci.yml/badge.svg?branch=main&event=push" alt="CI"></a>
  <a href="https://www.npmjs.com/package/zod-request"><img src="https://img.shields.io/npm/v/zod-request.svg" alt="NPM Version"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat" alt="MIT License"></a>
  <a href="https://bundlephobia.com/package/zod-request"><img src="https://img.shields.io/bundlephobia/minzip/zod-request" alt="npm bundle size"></a>
  <a href="https://packagephobia.com/result?p=zod-request"><img src="https://packagephobia.com/badge?p=zod-request" alt="Install Size"></a>
</h1>

_zod-request_ provides validated and type-safe HTTP requests using [Zod](https://zod.dev/). It offers the exact same API as native `fetch`, with extra validation features.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#license)

## 📦 Installation

```bash
npm install zod-request zod
```

<details>
<summary>Install using your favorite package manager</summary>

**pnpm**

```bash
pnpm add zod-request zod
```

**yarn**

```bash
yarn add zod-request zod
```

</details>

## 📖 Usage

### Basic Usage

Fetch data and validate the response schema automatically.

```ts
import { z } from 'zod';
import { fetch } from 'zod-request';

const todoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
});

const response = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
  schema: {
    response: todoSchema
  }
});

// Fully typed as { userId: number; id: number; title: string; completed: boolean }
const data = await response.json();
```

### Form Data

Send multipart form data with automatic Content-Type headers and type-safe validation.

```ts
import { z } from 'zod';
import { fetch } from 'zod-request';

const schema = {
  body: z.object({
    name: z.string(),
    age: z.number()
  }),
  response: z.object({
    form: z.record(z.any())
  })
};

const response = await fetch('https://httpbin.org/post', {
  method: 'POST',
  form: {
    name: 'John',
    age: 20
  },
  schema
});

const { form } = await response.json();
```

### Path Parameters

Replace template placeholders in the URL safely.

```ts
import { z } from 'zod';
import { fetch } from 'zod-request';

const response = await fetch(
  'https://jsonplaceholder.typicode.com/posts/{{id}}',
  {
    path: {
      id: 1
    },
    schema: {
      path: z.object({
        id: z.number()
      })
    }
  }
);
```

### Headers and Search Params

Validate incoming and outgoing request headers and search queries.

```ts
import { z } from 'zod';
import { fetch } from 'zod-request';

const response = await fetch('https://api.example.com/search', {
  params: {
    query: 'zod'
  },
  headers: {
    'X-Api-Key': 'secret'
  },
  schema: {
    searchParams: z.object({
      query: z.string()
    }),
    headers: z.object({
      'X-Api-Key': z.string()
    })
  }
});
```

### Skip Validation

Skip validation and parse raw json or text.

```ts
import { fetch } from 'zod-request';

const response = await fetch('https://jsonplaceholder.typicode.com/todos');
const rawData = await response.unsafeJson();
```

### Refining Requests

Modify request configuration or rewrite the final URL right before execution.

```ts
import { fetch } from 'zod-request';

const response = await fetch('https://api.example.com/data', {
  refine: (url, input) => {
    input.headers = {
      ...input.headers,
      'X-Request-Id': '12345'
    };
    return { url, input };
  }
});
```

### Custom Global Fetch

Override the default fetch client with any compliant environment fetcher.

```ts
import undici from 'undici';
import { setGlobalFetch } from 'zod-request';

setGlobalFetch(undici.fetch);
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/zod-request).

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/zod-request).

Thanks again for your support, it is much appreciated! 🙏

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi) and [contributors](https://github.com/shahradelahi/zod-request/graphs/contributors).
