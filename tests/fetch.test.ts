import { fetch, ResponseValidationError, SchemaError } from '@/index';
import { AssertionError, expect } from 'chai';
import { z, ZodError } from 'zod';

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

  it('should parse union schema', async () => {
    const resp = await fetch('https://www.virustotal.com/api/v3/files/{id}', {
      schema: {
        // response: z.object({
        //   error: z
        //     .object({
        //       code: z.number(),
        //       message: z.string()
        //     })
        //     .optional(),
        //   data: z.record(z.any()).optional()
        // })
        response: z.union([
          // error
          z.object({
            error: z.object({
              code: z.string(),
              message: z.string()
            })
          }),
          // success
          z.object({
            data: z.any()
          })
        ])
      }
    });

    const data = await resp.json();

    expect(data).to.be.an('object');

    if ('error' in data) {
      // Types are narrowed
      expect(data.error).to.have.property('code');
      expect(data.error).to.have.property('message');
    }
  });
});

describe('Fetch - FormData', () => {
  it('should send form data without schema though "body" field', async () => {
    const formData = new FormData();
    formData.append('name', 'John');

    const blob = new Blob(['Hello World'], { type: 'text/plain' });
    formData.append('file', blob, 'hello.txt');

    const resp = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: formData,
      schema: {
        response: z.object({
          headers: z.record(z.string()),
          files: z.record(z.string()),
          form: z.record(z.any())
        })
      }
    });

    expect(resp.ok).to.be.true;

    const { form, files, headers } = await resp.json();
    // console.log(data);

    expect(headers).to.be.an('object');
    expect(headers).to.have.property('Content-Type');
    expect(headers['Content-Type']).to.include('multipart/form-data; boundary=');

    expect(form).to.be.an('object');
    expect(form).to.have.property('name');
    expect(form.name).to.equal('John');

    expect(files).to.be.an('object');
    expect(files).to.have.property('file');
    expect(files.file).to.equal('Hello World');
  });

  it('should throw error because we have schema for body but no body', async () => {
    try {
      const resp = await fetch('https://httpbin.org/post', {
        schema: {
          response: z.object({
            headers: z.record(z.string()),
            files: z.record(z.string()),
            form: z.record(z.any())
          }),
          body: z.instanceof(FormData)
        }
      });

      await resp.json();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(Error);
      expect(err.message).to.equal('Body schema is defined but no body was provided.');
    }
  });
});

describe('Fetch - Headers', () => {
  it('should have optional headers', async () => {
    // This means skip header schema and pass any headers

    const resp = await fetch('https://httpbin.org/get', {
      headers: {
        'X-Custom-Header': 'value'
      },
      schema: {
        response: z.object({
          headers: z.record(z.string())
        })
      }
    });

    const data = await resp.json();

    expect(data).to.be.an('object');
    expect(data).to.have.property('headers');
    expect(data.headers).to.be.an('object');
    expect(data.headers).to.have.property('X-Custom-Header');
    expect(data.headers['X-Custom-Header']).to.equal('value');
  });

  it('should validate headers and work', async () => {
    const resp = await fetch('https://httpbin.org/get', {
      headers: {
        'X-Custom-Header': 'value'
      },
      schema: {
        response: z.object({
          headers: z.record(z.string())
        }),
        headers: z.object({
          'X-Custom-Header': z.string()
        })
      }
    });

    const data = await resp.json();

    expect(data).to.be.an('object');
    expect(data).to.have.property('headers');
    expect(data.headers).to.be.an('object');
    expect(data.headers).to.have.property('X-Custom-Header');
    expect(data.headers['X-Custom-Header']).to.equal('value');
  });

  it('should throw error because we have schema for headers but no headers', async () => {
    try {
      // @ts-expect-error @ts-expect-error
      const resp = await fetch('https://httpbin.org/get', {
        schema: {
          response: z.object({
            headers: z.record(z.string())
          }),
          headers: z.object({
            'X-Custom-Header': z.string()
          })
        }
      });

      await resp.json();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(Error);
      expect(err.message).to.equal('Headers schema is defined but no headers were provided.');
    }
  });

  it('should throw error because headers do not match schema', async () => {
    try {
      const resp = await fetch('https://httpbin.org/get', {
        headers: {
          // @ts-expect-error @ts-expect-error
          'X-Custom-Header': 123
        },
        schema: {
          response: z.object({
            headers: z.record(z.string())
          }),
          headers: z.object({
            'X-Custom-Header': z.string()
          })
        }
      });

      await resp.json();

      expect.fail('Should have thrown an error.');
    } catch (err: any) {
      if (err instanceof AssertionError) {
        throw err;
      }

      expect(err).to.instanceOf(ZodError);
    }
  });

  it('should not add optional headers as undefined', async () => {
    const resp = await fetch('https://httpbin.org/get', {
      headers: {
        'X-Custom-Header': 'value'
      },
      schema: {
        response: z.object({
          headers: z.record(z.string())
        }),
        headers: z.object({
          'X-Custom-Header': z.string(),
          'X-Optional-Header': z.string().optional()
        })
      }
    });

    const data = await resp.json();

    expect(data).to.be.an('object');
    expect(data).to.have.property('headers');
    expect(data.headers).to.be.an('object');
    expect(data.headers).to.have.property('X-Custom-Header');
    expect(data.headers['X-Custom-Header']).to.equal('value');
    expect(data.headers).to.not.have.property('X-Optional-Header');
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
});
