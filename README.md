# zod-request

[![npm](https://img.shields.io/npm/v/zod-request)](https://www.npmjs.com/package/zod-request)
[![install size](https://packagephobia.com/badge?p=zod-request)](https://packagephobia.com/result?p=zod-request)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://choosealicense.com/licenses/mit/)
[![GitHub stars](https://img.shields.io/github/stars/shahradelahi/zod-request?style=social)](https://github.com/shahradelahi/zod-request/stargazers)

> Validated and Type-safe HTTP requests using Zod

## Notable Features

- Exact API as Native `fetch` with extra features
- Supports every environment (**Node.js**, **Browser**, Bun, etc.)

## 📦 Installation

```bash
npm install zod-request zod
```

## 📖 Usage

```typescript
import { z } from 'zod';
import { fetch } from 'zod-request';

const todoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
});

const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'GET',
  headers: {
    Accept: 'application/json'
  },
  schema: {
    response: z.array(todoSchema)
  }
});

// type of data is [{ userId: number, id: number, title: string, completed: boolean }, ...]
const data = await response.json();

console.log(Array.isArray(data)); // true
console.log(data.length); // 200
```

## 📚 Documentation

For all configuration options, please see [the API docs](https://paka.dev/npm/zod-request@canary/api).

## 🤝 Contributing

You can contribute to this project by opening an issue or a pull request
on [GitHub](https://github.com/shahradelahi/zod-request). Feel free to contribute, we care about your ideas and
suggestions.

## Examples

<details>
  <summary>Send a Post request with a FormData body</summary>

```typescript
import { z } from 'zod';
import { fetch } from 'zod-request';

const schema = {
  body: z.object({
    name: z.string(),
    age: z.number()
  }),
  response: z.object({
    form: z.record(z.any()),
    headers: z.record(z.string())
  })
};

const response = await fetch('https://httpbin.org/post', {
  method: 'POST',
  form: {
    name: 'John',
    age: 20
  },
  schema: schema
});

const { form, headers } = await response.json();
console.log(form); // { name: 'John', age: '20' }
console.log(headers); // { 'Content-Type': 'multipart/form-data; boundary=---- ...
```

</details>

<details>
  <summary>Skip body validation for a request</summary>

```typescript
const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'GET',
  headers: {
    Accept: 'application/json'
  }
});

const data = await response.unsafeJson(); // Throws an error if the response is not a valid JSON

console.log(Array.isArray(data)); // true
console.log(data.length); // 200
```

</details>

## Relevant Links

- [Zod Documentation](https://zod.dev/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Transform JSON to Zod Schema](https://transform.tools/json-to-zod)

## License

[MIT](LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
