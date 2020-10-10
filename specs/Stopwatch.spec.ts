
import { expect } from 'chai';
import { Stopwatch } from '../src/Util/Stopwatch';
import { sleep } from './util';

describe.only('Stopwatch', function () {

   it('should keep track of time', async function () {

      let min = 10;
      let max = 25;

      let sw = new Stopwatch();
      await sleep(10);
      expect(sw.elapsedMs).to.be.greaterThan(min).and.lessThan(max);
      expect(sw.elapsedS).to.be.greaterThan(min / 1000).and.lessThan(max / 1000);
      expect(sw.running).to.be.true;
   });

   it('should start automatically start', function () {

      let sw = new Stopwatch();
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(0);
   });

   it('should not start automatically if false is passed to the constructor', function () {

      let sw = new Stopwatch(false);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(0);
   });

   it('should track time in seconds and milliseconds', async function () {

      let sw = new Stopwatch();
      await sleep(10);
      sw.pause();
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(1000 * sw.elapsedS);
   });

   it('should be pausable/resumable', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      sw.pause();
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.paused).to.be.true;
      expect(sw.running).to.be.false;

      let elapsedMs = sw.elapsedMs;
      await sleep(1);
      expect(sw.elapsedMs).to.equal(elapsedMs);

      sw.resume();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(elapsedMs);
   });

   it('should be restartable', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);
      let oldElapsedMs = sw.elapsedMs;

      sw.restart();
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.elapsedMs).to.be.lessThan(oldElapsedMs);
   });

   it('should be restartable (while paused)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);
      let oldElapsedMs = sw.elapsedMs;

      sw.pause();
      sw.restart();
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.elapsedMs).to.be.lessThan(oldElapsedMs);
   });

   it('should be resettable (start=true)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);
      let oldElapsedMs = sw.elapsedMs;

      sw.reset(true);
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.elapsedMs).to.be.lessThan(oldElapsedMs);
   });


   it('should be resettable (start=false)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);

      sw.reset(false);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(0);
   });

   it('should be resettable (while paused) (start=true)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);
      let oldElapsedMs = sw.elapsedMs;

      sw.pause();
      sw.reset(true);
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(0);
      expect(sw.elapsedMs).to.be.lessThan(oldElapsedMs);
   });


   it('should be resettable (while paused) (start=false)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);

      sw.pause();
      sw.reset(false);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(0);
   });


   it('should be adjustable', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);

      sw.adjustMs(5000);

      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.greaterThan(5000);

      sw.adjustMs(-10000);
      expect(sw.running).to.be.true;
      expect(sw.elapsedMs).to.be.lessThan(0);
   });

   it('should be adjustable (while paused)', async function () {

      let sw = new Stopwatch();
      await sleep(1);
      expect(sw.elapsedMs).to.be.greaterThan(0);

      sw.pause();
      let elapsedMs = sw.elapsedMs;

      sw.adjustMs(5000);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(5000 + elapsedMs);

      sw.adjustMs(-10000);
      expect(sw.running).to.be.false;
      expect(sw.elapsedMs).to.equal(5000 - 10000 + elapsedMs);
   });
});
