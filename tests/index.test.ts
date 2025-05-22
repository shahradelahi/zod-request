import { expect } from 'chai';
import { z } from 'zod';
import { fetch } from 'zod-request';

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

    expect(data).to.be.an('array');
    expect(data.length).to.equal(200);
  });

  it('#2 - Post FormData', async () => {
    const schema = {
      body: z.object({
        name: z.string(),
        age: z.number()
      }),
      response: z.object({
        headers: z.record(z.string()),
        form: z.record(z.any())
      })
    };

    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      // We not need to set Content-Type, it will automatically set to 'multipart/form-data' and its boundary
      form: {
        name: 'John',
        age: 20
      },
      schema: schema
    });

    const data = await response.json();
    // console.log(data); // { form: { name: 'John', age: '20' } }

    expect(data).to.be.an('object');
    expect(data.headers).to.be.an('object');
    expect(data.form).to.be.an('object');

    const headers = data.headers!;
    expect(headers).to.be.an('object');
    expect(headers['Content-Type']).to.be.a('string');
    expect(headers['Content-Type']).to.include('multipart/form-data');

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

    expect(data).to.be.an('array');
    expect(data.length).to.equal(200);
  });
});
