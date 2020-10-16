import { expect } from 'chai';
import { CountdownTimer } from '../src/Util/CountdownTimer';
import { sleep } from './util';

describe('CountdownTimer', function () {

   it('should keep track of time', async function () {

      let timer = new CountdownTimer();
      let durationMs = 10;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.durationMin).to.equal(durationMs / (60 * 1000));
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(durationMs);
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);
      expect(timer.running).to.be.true;
      expect(timer.remainingMs).to.be.greaterThan(0);
      expect(timer.remainingMs).to.be.lessThan(durationMs);
      expect(timer.expired).to.be.false;

      await sleep(durationMs);
      expect(timer.expired).to.be.true;
      expect(timer.remainingMs).to.equal(0);
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(durationMs);
   });

   it('should not be running until started', function () {

      let timer = new CountdownTimer();
      timer.durationMs = 5;
      expect(timer.running).to.be.false;

      timer.start();
      expect(timer.running).to.be.true;
   });

   it('should be able to set duration to 0', function () {

      let timer = new CountdownTimer();
      timer.durationMs = 0;
      expect(timer.running).to.be.false;

      timer.start();

      // should immediately go to expired state
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.true;
   });

   it('should be able to set duration while running', async function () {

      let timer = new CountdownTimer();
      timer.durationMs = 1000;
      expect(timer.running).to.be.false;

      timer.start();
      expect(timer.running).to.be.true;

      timer.durationMs = 200;
      await sleep(100);

      // not yet expired
      expect(timer.running).to.be.true;
      expect(timer.expired).to.be.false;

      await sleep(100);

      // now expired
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.true;
   });

   it('should be able to set duration while running', async function () {

      let timer = new CountdownTimer();
      timer.durationMs = 1000;
      expect(timer.running).to.be.false;

      timer.start();
      expect(timer.running).to.be.true;

      await sleep(100);

      timer.durationMs = 50;

      // should immediately go to expired state
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.true;
   });

   it('should should be pausable/resumable', async function () {
      let timer = new CountdownTimer();
      let durationMs = 20;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.true;
      expect(timer.remainingMs).to.be.greaterThan(0);
      expect(timer.remainingMs).to.be.lessThan(durationMs);
      expect(timer.expired).to.be.false;

      timer.stop();
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      let remainingMs = timer.remainingMs;

      await sleep(durationMs);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.expired).to.be.false;
      expect(timer.remainingMs).to.equal(remainingMs);

      timer.start();
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.true;

      await sleep(durationMs);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.expired).to.be.true;
      expect(timer.remainingMs).to.equal(0);
   });

   it('should should be resettable (running=true, expired=false)', async function () {
      let timer = new CountdownTimer();
      let durationMs = 20;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.true;
      expect(timer.remainingMs).to.be.greaterThan(0);
      expect(timer.remainingMs).to.be.lessThan(durationMs);
      expect(timer.expired).to.be.false;

      timer.reset();
      await sleep(1);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(durationMs);
      expect(timer.expired).to.be.false;
   });

   it('should should be resettable (running=false, expired=false)', async function () {
      let timer = new CountdownTimer();
      let durationMs = 20;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);
      timer.stop();

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.be.greaterThan(0);
      expect(timer.remainingMs).to.be.lessThan(durationMs);
      expect(timer.expired).to.be.false;

      timer.reset();
      await sleep(1);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(durationMs);
      expect(timer.expired).to.be.false;
   });

   it('should should be resettable (expired=true)', async function () {
      let timer = new CountdownTimer();
      let durationMs = 1;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(10);

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(0);
      expect(timer.expired).to.be.true;

      timer.reset();
      await sleep(1);
      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(durationMs);
      expect(timer.expired).to.be.false;
   });

   it('expiring should stop the timer', async function () {
      let timer = new CountdownTimer();
      let durationMs = 1;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(10);

      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(0);
   });

   it('should be ok to call stop() after expiring', async function () {
      let timer = new CountdownTimer();
      let durationMs = 1;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(10);

      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(0);

      timer.stop();
      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(0);
   });

   it('should be ok to call stop() while paused', async function () {
      let timer = new CountdownTimer();
      let durationMs = 20;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);

      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.true;
      expect(timer.remainingMs).to.be.greaterThan(0);

      timer.stop();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.be.greaterThan(0);


      timer.stop();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.be.greaterThan(0);
   });

   it('should be ok to call start() while running', async function () {
      let timer = new CountdownTimer();
      let durationMs = 40;
      timer.durationMs = durationMs;

      expect(timer.durationMs).to.equal(durationMs);
      expect(timer.running).to.be.false;
      expect(timer.expired).to.be.false;

      timer.start();
      await sleep(1);

      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.true;
      let remainingMs = timer.remainingMs;
      expect(remainingMs).to.be.greaterThan(0);

      timer.start();
      await sleep(1);

      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.true;
      expect(timer.remainingMs).to.be.lessThan(remainingMs);

      await sleep(durationMs);
      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.remainingMs).to.equal(0);
   });

   [
      { running: true, durationMs: 10, remainingMs: 3 },
      { running: false, durationMs: 10, remainingMs: 3 },
      { running: true, durationMs: 0, remainingMs: 3 },
      { running: false, durationMs: 0, remainingMs: 3 },
      { running: true, durationMs: -10, remainingMs: 3 },
      { running: false, durationMs: -10, remainingMs: 3 },
      { running: true, durationMs: 10, remainingMs: 0 },
      { running: false, durationMs: 10, remainingMs: 0 },
      { running: true, durationMs: 0, remainingMs: 0 },
      { running: false, durationMs: 0, remainingMs: 0 },
      { running: true, durationMs: -10, remainingMs: 0 },
      { running: false, durationMs: -10, remainingMs: 0 },
      { running: true, durationMs: 10, remainingMs: -3 },
      { running: false, durationMs: 10, remainingMs: -3 },
      { running: true, durationMs: 0, remainingMs: -3 },
      { running: false, durationMs: 0, remainingMs: -3 },
      { running: true, durationMs: -10, remainingMs: -3 },
      { running: false, durationMs: -10, remainingMs: -3 },
   ].forEach((info) => {
      it('should synchronize ' + JSON.stringify(info), async function () {
         let timer = new CountdownTimer();
         timer.durationMs = 40;
         timer.start();
         await sleep(1);

         timer.synchronize(info);

         let remainingMs = Math.max(0, Math.min(info.remainingMs, info.durationMs));
         let durationMs = Math.max(info.durationMs, 0);

         expect(timer.running).to.equal(info.running && durationMs > 0 && remainingMs > 0);
         expect(timer.expired).to.equal(remainingMs === 0);
         expect(timer.durationMs).to.equal(durationMs);
         if (timer.running) {
            expect(timer.remainingMs).to.be.lessThan(remainingMs);
         }
         else {
            expect(timer.remainingMs).to.equal(remainingMs);
         }
      });
   });

   it('should adjust up (running=true)', function () {
      let timer = new CountdownTimer();
      let durationMs = 3.5 * 60 * 1000;
      timer.durationMs = durationMs;

      timer.start();
      expect(timer.running).to.be.true;

      timer.addOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(4 * 60 * 1000);
      expect(timer.remainingMs).to.equal(4 * 60 * 1000);

      timer.addOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(5 * 60 * 1000);
      expect(timer.remainingMs).to.equal(5 * 60 * 1000);
   });

   it('should adjust up (running=false)', function () {
      let timer = new CountdownTimer();
      let durationMs = 3.5 * 60 * 1000;
      timer.durationMs = durationMs;

      expect(timer.running).to.be.false;

      timer.addOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(4 * 60 * 1000);
      expect(timer.remainingMs).to.equal(4 * 60 * 1000);

      timer.addOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(5 * 60 * 1000);
      expect(timer.remainingMs).to.equal(5 * 60 * 1000);
   });

   it('should adjust down (running=true)', function () {
      let timer = new CountdownTimer();
      let durationMs = 3.5 * 60 * 1000;
      timer.durationMs = durationMs;

      timer.start();
      expect(timer.running).to.be.true;

      timer.subtractOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(3 * 60 * 1000);
      expect(timer.remainingMs).to.equal(3 * 60 * 1000);

      timer.subtractOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(2 * 60 * 1000);
      expect(timer.remainingMs).to.equal(2 * 60 * 1000);
   });

   it('should adjust down (running=false)', function () {
      let timer = new CountdownTimer();
      let durationMs = 3.5 * 60 * 1000;
      timer.durationMs = durationMs;

      expect(timer.running).to.be.false;

      timer.subtractOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(3 * 60 * 1000);
      expect(timer.remainingMs).to.equal(3 * 60 * 1000);

      timer.subtractOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(2 * 60 * 1000);
      expect(timer.remainingMs).to.equal(2 * 60 * 1000);
   });

   it('should not adjust down below 0', function () {
      let timer = new CountdownTimer();
      let durationMs = 1.5 * 60 * 1000;
      timer.durationMs = durationMs;

      expect(timer.running).to.be.false;

      timer.subtractOne();
      expect(timer.expired).to.be.false;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(1 * 60 * 1000);
      expect(timer.remainingMs).to.equal(1 * 60 * 1000);

      timer.subtractOne();
      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(0);
      expect(timer.remainingMs).to.equal(0);

      timer.subtractOne();
      expect(timer.expired).to.be.true;
      expect(timer.running).to.be.false;
      expect(timer.durationMs).to.equal(0);
      expect(timer.remainingMs).to.equal(0);
   });


});
