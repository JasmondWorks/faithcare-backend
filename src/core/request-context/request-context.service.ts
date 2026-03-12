// import { AsyncLocalStorage } from 'async_hooks';

// export class RequestContext {
//   private static storage = new AsyncLocalStorage();

//   static run(data, callback) {
//     this.storage.run(data, callback);
//   }

//   static get(key: string) {
//     const store = this.storage.getStore();
//     return store?.[key];
//   }
// }
