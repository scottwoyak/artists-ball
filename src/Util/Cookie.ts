export class Cookie {
   public static get(name: string): string {
      let tokens = document.cookie.split(';');
      for (let token of tokens) {
         if (token.startsWith(name + '=')) {
            return token.substr(name.length + 1).trim();
         }
      }

      return undefined;
   }

   public static set(name: string, value: string, expiresInSec: number) {
      document.cookie = name + '=' + value + ';max-age=' + expiresInSec;
   }

   public static delete(name: string) {
      document.cookie = name + '=EXPIRED;expires=Thu, 01 Jan 1970 00:00:01 GMT';
   }

   public static updateExpiration(name: string, expiresInSec: number) {
      let value = Cookie.get(name);
      Cookie.set(name, value, expiresInSec);
   }
}