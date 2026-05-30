import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { fetch, setGlobalFetch } from '.';

describe('Docs', () => {
  it('#1', async () => {
    const todoSchema = z.object({
      userId: z.number(),
      id: z.number(),
      title: z.string(),
      completed: z.boolean()
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          Array.from({ length: 200 }, (_, i) => ({
            userId: 1,
            id: i + 1,
            title: `Todo ${i + 1}`,
            completed: false
          }))
        )
      )
    );
    setGlobalFetch(mockFetch);

    const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      schema: {
        response: z.array(todoSchema)
      }
    });

    const data = await response.json();

    expect(data).to.be.an('array');
    expect(data.length).to.equal(200);
    expect(mockFetch).toHaveBeenCalledWith(new URL('https://jsonplaceholder.typicode.com/todos'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('#2 - Post FormData', async () => {
    const schema = {
      body: z.object({
        name: z.string(),
        age: z.number()
      }),
      response: z
        .object({
          headers: z.record(z.string(), z.string()),
          form: z.record(z.string(), z.any())
        })
        .passthrough()
    };

    const mockFetch = vi.fn().mockImplementation(async (_url, init) => {
      // Re-construct form object from FormData body
      const form: Record<string, string> = {};
      if (init.body instanceof FormData) {
        init.body.forEach((val: any, key: string | number) => {
          form[key] = String(val);
        });
      }
      return new Response(
        JSON.stringify({
          headers: {
            'Content-Type': 'multipart/form-data; boundary=...'
          },
          form
        })
      );
    });
    setGlobalFetch(mockFetch);

    const response = await fetch('https://httpbun.com/post', {
      method: 'POST',
      form: {
        name: 'John',
        age: 20
      },
      schema: schema
    });

    const data = await response.json();

    expect(data).to.be.an('object');
    expect(data.headers).to.be.an('object');
    expect(data.form).to.be.an('object');

    const headers = data.headers!;
    expect(headers).to.be.an('object');
    expect(headers['Content-Type']).to.be.a('string');
    expect(headers['Content-Type']).to.include('multipart/form-data');

    const form = data.form!;
    expect(form['name']).to.be.a('string').to.equal('John');
    expect(form['age']).to.be.a('string').to.equal('20');
  });

  it('#3 - Get Unsafe response body (Skip validation)', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify(
          Array.from({ length: 200 }, (_, i) => ({
            id: i + 1
          }))
        )
      )
    );
    setGlobalFetch(mockFetch);

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
