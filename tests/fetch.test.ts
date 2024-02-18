import { fetch, ResponseValidationError, SchemaError } from '@/index';
import { AssertionError, expect } from 'chai';
import { z } from 'zod';

const todoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
});

const postSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  body: z.string()
});

describe('Fetch', () => {
  it('fetch single todo', async () => {
    const resp = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
      schema: {
        response: todoSchema
      }
    });

    expect(resp.ok).to.be.true;

    const data = await resp.json();

    expect(data).to.be.an('object');
    expect(data).to.have.property('userId');
  });

  it('fetch todos unsafe text', async () => {
    const resp = await fetch('https://jsonplaceholder.typicode.com/todos', {
      schema: {
        response: z.array(todoSchema)
      }
    });

    expect(resp.ok).to.be.true;

    const data = await resp.unsafeText();

    expect(data).to.be.a('string');
    expect(data).to.not.equal('');
  });

  it('fetch posts', async () => {
    const resp = await fetch('https://jsonplaceholder.typicode.com/posts', {
      schema: {
        response: z.array(postSchema)
      }
    });

    expect(resp.ok).to.be.true;

    const data = await resp.json();

    expect(data).to.be.an('array');
    expect(data).to.have.lengthOf(100);
  });
});

describe('Fetch - Error', () => {
  it('Response does not match schema', async () => {
    try {
      const resp = await fetch('https://jsonplaceholder.typicode.com/posts', {
        schema: {
          response: z.array(todoSchema) // <-- This should be postSchema
        }
      });

      await resp.json();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(ResponseValidationError);
    }
  });

  it('Uses text() with non-text schema', async () => {
    try {
      const resp = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
        schema: {
          response: z.array(z.any())
        }
      });

      await resp.text();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(SchemaError);
      expect(err.message).to.equal('Response schema must be a string.');
    }
  });

  it('Uses json() with non-json schema', async () => {
    try {
      const resp = await fetch('https://jsonplaceholder.typicode.com/posts', {
        schema: {
          response: z.string()
        }
      });

      await resp.json();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(SchemaError);
      expect(err.message).to.equal('Response schema must be an object or an array.');
    }
  });
});
