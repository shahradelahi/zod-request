import { expect } from 'chai';
import { fetch } from '@/index';
import { z } from 'zod';

describe('Fetch', () => {
  it('fetch', async () => {
    const resp = await fetch('https://jsonplaceholder.typicode.com/todos/1', {
      method: 'GET',
      schema: {
        response: z.object({
          userId: z.number(),
          id: z.number(),
          title: z.string(),
          completed: z.boolean()
        })
      }
    });

    expect(resp.ok).to.be.true;

    const data = await resp.json();

    console.log(data);
  });
});
