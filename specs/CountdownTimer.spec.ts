import { expect } from 'chai';
import { CountdownTimer } from '../src/Apps/Squint/CountdownTimer';
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
});
