export class Cookie {
   public static get(name: string): string | undefined {
      const tokens = document.cookie.split(';');
      for (const token of tokens) {
         if (token.startsWith(name + '=')) {
            return token.substr(name.length + 1).trim();
         }
      }

      return undefined;
   }

   public static set(name: string, value: string, expiresInSec: number): void {
      document.cookie = name + '=' + value + ';max-age=' + expiresInSec;
   }

   public static delete(name: string): void {
      document.cookie = name + '=EXPIRED;expires=Thu, 01 Jan 1970 00:00:01 GMT';
   }

   public static updateExpiration(name: string, expiresInSec: number): void {
      const value = Cookie.get(name);
      if (value) {
         Cookie.set(name, value, expiresInSec);
      }
   }
}