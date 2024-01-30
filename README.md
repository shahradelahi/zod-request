# zod-request

Valid and Type-safe HTTP requests using Zod

## Installation

```bash
npm install zod-request
```

## Usage

```typescript
import { fetch } from 'zod-request';
import { z } from 'zod';

const todoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
});

const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
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

## Examples

<details>
  <summary>POST request with Form Data</summary>

```typescript
import { fetch, type RequestSchema } from 'zod-request';
import { z } from 'zod';

const schema: RequestSchema = {
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
  headers: {
    'Content-Type': 'application/json'
  },
  form: {
    name: 'John',
    age: 20
  },
  schema: schema
});

const data = await response.json();
console.log(data); // { form: { name: 'John', age: '20' } }
```

</details>

<details>
  <summary>Get Unsafe Response body (Skip validation)</summary>

```typescript
const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.unsafeJson();

console.log(Array.isArray(data)); // true
console.log(data.length); // 200
```

</details>

## Relevant Links

- [Zod Documentation](https://zod.dev/)
- [Transform JSON to Zod Schema](https://transform.tools/json-to-zod)

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details
