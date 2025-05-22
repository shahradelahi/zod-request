import { fetch } from 'undici';
import { setGlobalFetch } from 'zod-request';

setGlobalFetch(fetch);
