import { fetch, RequestSchema } from '@/index';
import { expect } from 'chai';
import { z } from 'zod';

describe('Docs', () => {
  it('#1', async () => {
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
  });

  it('#2 - Post FormData', async () => {
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

    expect(data.form).to.be.an('object');
    const form = data.form!;

    expect(form.name).to.be.a('string');
    expect(form.name).to.equal('John');

    expect(form.age).to.be.a('string');
    expect(form.age).to.equal('20');
  });

  it('#3 - Get Unsafe response body (Skip validation)', async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.unsafeJson();

    console.log(Array.isArray(data)); // true
    console.log(data.length); // 200
  });
});
