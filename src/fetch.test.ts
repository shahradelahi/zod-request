import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';

import { generateRequest, ZodRequestError, ZodResponse, ZodValidationError } from '.';

const todoSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean()
});

describe('generateRequest', () => {
  describe('Path params', () => {
    it('should parse path params and fill template', () => {
      const { url } = generateRequest('https://jsonplaceholder.typicode.com/posts/{{id}}', {
        path: {
          id: 1
        },
        schema: {
          path: z.object({
            id: z.number()
          })
        }
      });

      expect(url.toString()).to.equal('https://jsonplaceholder.typicode.com/posts/1');
    });

    it('should fill path template without schema though "path" field', () => {
      const { url } = generateRequest('https://jsonplaceholder.typicode.com/{{sector}}/{{id}}', {
        path: {
          id: 1,
          sector: 'posts'
        }
      });

      expect(url.pathname).to.equal('/posts/1');
    });

    it('should throw error because path schema is defined but no path was provided', () => {
      expect(() => {
        // @ts-expect-error Property path is missing in type
        generateRequest('https://jsonplaceholder.typicode.com/posts/{{id}}', {
          schema: {
            path: z.object({
              id: z.number()
            })
          }
        });
      }).toThrowError('Path schema is defined but no path was provided.');
    });
  });

  describe('Search params', () => {
    it('should parse search params using schema.searchParams', () => {
      const { url } = generateRequest('https://jsonplaceholder.typicode.com/posts', {
        params: {
          userId: '1'
        },
        schema: {
          searchParams: z.object({
            userId: z.string()
          })
        }
      });

      expect(url.searchParams.get('userId')).to.equal('1');
    });
  });

  describe('Headers', () => {
    it('should have optional headers when no schema is provided', () => {
      const { input } = generateRequest('https://httpbun.com/get', {
        headers: {
          'X-Custom-Header': 'value'
        }
      });

      expect(input.headers).to.be.an('object');
      expect(input.headers).to.have.property('X-Custom-Header');
      expect((input.headers as any)['X-Custom-Header']).to.equal('value');
    });

    it('should validate headers and work', () => {
      const { input } = generateRequest('https://httpbun.com/get', {
        headers: {
          'X-Custom-Header': 'value'
        },
        schema: {
          headers: z.object({
            'X-Custom-Header': z.string()
          })
        }
      });

      expect(input.headers).to.be.an('object');
      expect(input.headers).to.have.property('X-Custom-Header');
      expect((input.headers as any)['X-Custom-Header']).to.equal('value');
    });

    it('should throw error because we have schema for headers but no headers', () => {
      expect(() => {
        // @ts-expect-error Property headers is missing in type
        generateRequest('https://httpbun.com/get', {
          schema: {
            headers: z.object({
              'X-Custom-Header': z.string()
            })
          }
        });
      }).toThrowError('Headers schema is defined but no headers were provided.');
    });

    it('should throw error because headers do not match schema', () => {
      expect(() => {
        generateRequest('https://httpbun.com/get', {
          headers: {
            // @ts-expect-error @ts-expect-error
            'X-Custom-Header': 123
          },
          schema: {
            headers: z.object({
              'X-Custom-Header': z.string()
            })
          }
        });
      }).toThrow(ZodError);
    });

    it('should not add optional headers as undefined', () => {
      const { input } = generateRequest('https://httpbun.com/get', {
        headers: {
          'X-Custom-Header': 'value'
        },
        schema: {
          headers: z.object({
            'X-Custom-Header': z.string(),
            'X-Optional-Header': z.string().optional()
          })
        }
      });

      expect(input.headers).to.be.an('object');
      expect(input.headers).to.have.property('X-Custom-Header');
      expect((input.headers as any)['X-Custom-Header']).to.equal('value');
      expect(input.headers).to.not.have.property('X-Optional-Header');
    });
  });

  describe('FormData & Body', () => {
    it('should send form data without schema though "body" field', () => {
      const formData = new FormData();
      formData.append('name', 'John');

      const blob = new Blob(['Hello World'], { type: 'text/plain' });
      formData.append('file', blob, 'hello.txt');

      const { input } = generateRequest('https://httpbun.com/post', {
        method: 'POST',
        body: formData
      });

      expect(input.body).to.be.instanceOf(FormData);
      const fd = input.body as FormData;
      expect(fd.get('name')).to.equal('John');
      expect(fd.get('file')).to.be.instanceOf(Blob);
    });

    it('should parse body schema with form input and return FormData', () => {
      const { input } = generateRequest('https://httpbun.com/post', {
        method: 'POST',
        form: {
          name: 'John',
          age: 20
        },
        schema: {
          body: z.object({
            name: z.string(),
            age: z.number()
          })
        }
      });

      expect(input.body).to.be.instanceOf(FormData);
      const fd = input.body as FormData;
      expect(fd.get('name')).to.equal('John');
      expect(fd.get('age')).to.equal('20');
    });

    it('should throw error because we have schema for body but no body', () => {
      expect(() => {
        // @ts-expect-error Property form is missing in type
        generateRequest('https://httpbun.com/post', {
          method: 'POST',
          schema: {
            body: z.instanceof(FormData)
          }
        });
      }).toThrowError('Body schema is defined but no body was provided.');
    });

    it('should throw error if method is GET and body is provided', () => {
      expect(() => {
        generateRequest('https://httpbun.com/get', {
          method: 'GET',
          // @ts-expect-error TS2322: Type string is not assignable to type undefined
          body: 'hello'
        });
      }).toThrowError('Request with GET method cannot have body.');
    });

    it('should stringify body if content-type is json', () => {
      const { input } = generateRequest('https://httpbun.com/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          foo: 'bar'
        },
        schema: {
          body: z.object({
            foo: z.string()
          })
        }
      });

      expect(input.body).to.equal(JSON.stringify({ foo: 'bar' }));
    });
  });

  describe('Refine', () => {
    it('should refine request url and options', () => {
      const { url, input } = generateRequest('https://httpbun.com/get', {
        refine: (u, i) => {
          u.pathname = '/refined';
          i.headers = { ...i.headers, 'X-Refined': 'yes' };
          return { url: u, input: i };
        }
      });

      expect(url.pathname).to.equal('/refined');
      expect(input.headers).to.have.property('X-Refined', 'yes');
    });
  });
});

describe('ZodResponse', () => {
  describe('JSON response validation', () => {
    it('should validate json matching schema', async () => {
      const raw = new Response(
        JSON.stringify({ userId: 1, id: 1, title: 'delectus aut autem', completed: false })
      );
      const resp = new ZodResponse(raw, todoSchema);

      expect(resp.rawRes).to.equal(raw);
      expect(resp.schema).to.equal(todoSchema);

      const data = await resp.json();
      expect(data).to.be.an('object');
      expect(data.userId).to.equal(1);
    });

    it('should throw validation error when response json does not match schema', async () => {
      const raw = new Response(
        JSON.stringify({
          userId: 'invalid_type',
          id: 1,
          title: 'delectus aut autem',
          completed: false
        })
      );
      const resp = new ZodResponse(raw, todoSchema);

      await expect(resp.json()).rejects.toThrow(ZodValidationError);
    });

    it('should fetch raw json using unsafeJson without validating schema', async () => {
      const raw = new Response(
        JSON.stringify({
          userId: 'invalid_type',
          id: 1,
          title: 'delectus aut autem',
          completed: false
        })
      );
      const resp = new ZodResponse(raw, todoSchema);

      const data = await resp.unsafeJson();
      expect(data.userId).to.equal('invalid_type');
    });

    it('should parse union schema correctly', async () => {
      const unionSchema = z.union([
        z.object({
          error: z.object({
            code: z.string(),
            message: z.string()
          })
        }),
        z.object({
          data: z.any()
        })
      ]);

      const raw = new Response(JSON.stringify({ error: { code: '404', message: 'Not found' } }));
      const resp = new ZodResponse(raw, unionSchema);

      const data = await resp.json();
      expect(data).to.have.property('error');
      if ('error' in data) {
        expect(data.error.code).to.equal('404');
      }
    });
  });

  describe('Text response validation', () => {
    it('should validate and return text when schema is ZodString', async () => {
      const raw = new Response('Hello World');
      const resp = new ZodResponse(raw, z.string());

      const data = await resp.text();
      expect(data).to.equal('Hello World');
    });

    it('should throw error when text() is used with a non-string schema', async () => {
      const raw = new Response('Hello World');
      const resp = new ZodResponse(raw, z.array(z.any()));

      await expect(resp.text()).rejects.toThrow(ZodRequestError);
    });

    it('should allow unsafeText without validation', async () => {
      const raw = new Response('Hello World');
      const resp = new ZodResponse(raw, z.array(z.any()));

      const data = await resp.unsafeText();
      expect(data).to.equal('Hello World');
    });
  });

  describe('Clone', () => {
    it('should clone response preserving schema', async () => {
      const raw = new Response(
        JSON.stringify({ userId: 1, id: 1, title: 'hello', completed: true })
      );
      const resp = new ZodResponse(raw, todoSchema);

      const cloned = resp.clone();
      expect(cloned.schema).to.equal(todoSchema);

      const data = await cloned.json();
      expect(data.userId).to.equal(1);
    });
  });
});
