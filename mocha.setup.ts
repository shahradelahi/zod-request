import { setGlobalFetch } from 'zod-request';
import { fetch } from 'undici';

setGlobalFetch(fetch);
