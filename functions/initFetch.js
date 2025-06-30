import {
  fetch,
  Headers,
  Request,
  Response,
  FormData,
  File,
  Blob
} from 'undici';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
  globalThis.FormData = FormData;
  globalThis.File = File;
  globalThis.Blob = Blob;
}

export {}; // ensures this file is a module
