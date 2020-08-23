/* eslint-disable @typescript-eslint/no-unsafe-call */

import { assert } from 'chai';
import { Squint } from '../src/Apps/Squint/Squint';
import { WebSocketFactory } from '../src/Apps/Squint/WebSocketFactory';
import NodeWebSocket from 'ws';
import { SquintEvent } from '../src/Apps/Squint/SquintEvents';


const TestUrlLocalhost = 'ws://localhost:8080/V1/';
const TestUrlRemote = 'ws://squintserver-11278.nodechef.com/V1/';

// dissable log so that the console just shows Mocha output
console.log = () => { };

// replace browser WebSockets (that don't exist here) with Node WebSockets
WebSocketFactory.create = (url: string) => {
   return new NodeWebSocket(url) as unknown as WebSocket;
}

describe('Squint', function () {

   describe('connect()', function () {

      it('should connect', function (done) {
         let squint = new Squint();
         squint.connect(TestUrlLocalhost, 'Test Harness')
            .then(() => {
               // test passed
               squint.close();
               done();
            })
            .catch((err) => {
               // test failed
               done(err);
            });
      });

      it('should allow multiple connections', function (done) {
         let squint1 = new Squint();
         let squint2 = new Squint();
         let p1 = squint1.connect(TestUrlLocalhost, 'Tester1');
         let p2 = squint2.connect(TestUrlLocalhost, 'Tester2')

         Promise.all([p1, p2])
            .then(() => {
               squint1.close();
               squint2.close();
               done();
            })
            .catch((err) => {
               done(err);
            })
      });

      it('should fail if the server does not exist', function (done) {
         this.timeout(10000);
         let squint = new Squint();
         squint.connect('wss://dummyhost.com', 'Tester1')
            .then(() => {
               done('Expected connection to fail');
            })
            .catch((err) => {
               done();
            });
      });
   });


   /*
      describe('images', function () {
   
         it('should broadcast images to subscribers', function (done) {
            let squint1 = new Squint();
            let squint2 = new Squint();
            let p1 = squint1.connect(TestUrlLocalhost, 'Tester1');
            let p2 = squint2.connect(TestUrlLocalhost, 'Tester2')
   
            squint2.on({
               event: SquintEvent.Image,
               handler: (blob: Blob) => {
                  squint1.close();
                  squint2.close();
                  done();
               }
            });
   
            Promise.all([p1, p2])
               .then(() => {
                  console.log('sending blob');
                  let blob = new ArrayBuffer(100);
                  //let blob = new Blob(['{}'], { type: 'application/json' });
                  squint1.sendImage(<Blob><any>blob);
                  squint2.subscribe(squint1.connectionInfo.connectionId);
               })
               .catch((err) => {
                  done(err);
               })
         });
      });
      */
});
