
let host: string;
let wsPre: string;
let httpPre: string;
if (location.hostname === 'localhost') {
   host = 'localhost:8080/V1/';
   wsPre = 'ws://';
   httpPre = 'http://';
}
else {
   host = 'squintserver-11278.nodechef.com/V1/'
   wsPre = 'wss://'
   httpPre = 'https://';
}
//export const SquintUrl = 'ws://192.168.86.23:8080/V1/'

export const SquintWsUrl = wsPre + host;
export const SquintHttpUrl = httpPre + host;

   //static readonly url = 'ws://localhost:8080/V1/'
   //static readonly url = 'wss://squintserver-11278.nodechef.com/V1/'


   //private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
   //private host = 'http://' + location.hostname + ':8080/V1';
   //private host = 'http://' + location.hostname + ':3000/';

   //static readonly url = 'https://squintserver-11278.nodechef.com/V1';
   //static readonly url = 'http://' + location.hostname + ':8080/V1'
   //static readonly url = 'http://localhost:8080/V1'
