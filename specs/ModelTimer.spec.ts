import { expect } from 'chai';
import { ModelTimer } from '../src/Apps/Squint/ModelTimer';
import { ITimerInfo } from '../src/Util/CountdownTimer';
import { Stopwatch } from '../src/Util/Stopwatch';
import { TestUrlLocalhost } from './Constants';
import { createSession, createSquint, sleep, squintAfterEach, squintBeforeEach, TimeMs } from './util';

describe.only('ModelTimer', function () {

   beforeEach(async function () {
      return squintBeforeEach(this);
   });

   afterEach(async function () {
      return squintAfterEach(this);
   });


   it('should tick', async function () {

      let squint = await createSquint(TestUrlLocalhost, 'Squint');

      let timer = new ModelTimer(squint);
      let sw = new Stopwatch(false);

      let promise = new Promise((resolve, reject) => {

         let tickCount = 0;
         timer.onTick = (info: ITimerInfo) => {
            tickCount++;

            try {
               expect(info.running).to.be.true;

               if (tickCount === 1) {
                  expect(sw.elapsedS).to.be.greaterThan(0);
                  expect(sw.elapsedS).to.be.lessThan(0.1);
               }
               else if (tickCount === 2) {
                  expect(sw.elapsedS).to.be.greaterThan(1);
                  expect(sw.elapsedS).to.be.lessThan(1.1);
               }
               else if (tickCount === 3) {
                  expect(sw.elapsedS).to.be.greaterThan(2);
                  expect(sw.elapsedS).to.be.lessThan(2.1);
                  timer.stop();
                  resolve();
               }
               else {
                  reject('tick #4 encountered');
               }
            }
            catch (err) {
               reject(err);
            }
         }
      });

      sw.start();
      timer.start();
      expect(timer.ticking).to.be.true;

      return promise;
   });

   it('should sound an alarm when time has expired', async function () {
      let squint = await createSquint(TestUrlLocalhost, 'Squint');

      let timer = new ModelTimer(squint);
      timer.durationMs = 100;
      let sw = new Stopwatch(false);

      let promise = new Promise((resolve, reject) => {

         timer.onAlarm = (sound: boolean) => {
            try {
               expect(timer.running).to.be.false;
               expect(timer.ticking).to.be.false;
               expect(sound).to.be.true;
               expect(sw.elapsedMs).to.be.greaterThan(100);
               expect(sw.elapsedMs).to.be.lessThan(120);
               resolve();

               timer.stopAlarm();
            }
            catch (err) {
               reject(err);
            }
         }
      });

      sw.start();
      timer.start();

      return promise;
   });

   it('should stop the alarm after the timeout period', async function () {
      let squint = await createSquint(TestUrlLocalhost, 'Squint');

      let timer = new ModelTimer(squint);
      timer.durationMs = 100;
      timer.alarmDurationMs = 200;

      let sw = new Stopwatch(false);

      let alarmCount = 0;
      let promise = new Promise((resolve, reject) => {

         timer.onAlarm = (sound: boolean) => {
            try {
               alarmCount++;

               if (alarmCount === 1) {
                  expect(timer.running).to.be.false;
                  expect(timer.ticking).to.be.false;
                  expect(sound).to.be.true;
                  expect(sw.elapsedMs).to.be.greaterThan(100);
                  expect(sw.elapsedMs).to.be.lessThan(120);
               }
               else if (alarmCount === 2) {
                  expect(timer.running).to.be.false;
                  expect(timer.ticking).to.be.false;
                  expect(sound).to.be.false;
                  expect(sw.elapsedMs).to.be.greaterThan(300);
                  expect(sw.elapsedMs).to.be.lessThan(350);
                  resolve();
               }
            }
            catch (err) {
               reject(err);
            }
         }
      });

      sw.start();
      timer.start();

      return promise;
   });

   enum Source {
      Host = 'Host',
      Viewer1 = 'Viewer1',
      Viewer2 = 'Viewer2',
   }

   [
      [Source.Viewer2, Source.Host],
      [Source.Viewer2, Source.Viewer1],
      [Source.Viewer2, Source.Viewer2],
      [Source.Host, Source.Host],
      [Source.Host, Source.Viewer1],
      [Source.Host, Source.Viewer2],
      [Source.Viewer1, Source.Host],
      [Source.Viewer1, Source.Viewer1],
      [Source.Viewer1, Source.Viewer2],
   ].forEach((startStop: Source[]) => {

      it.only('should synchronize timer starts/stops start:' + startStop[0] + ' stop:' + startStop[1], async function () {
         let { squintHost, squintViewers } = await createSession(2);
         await sleep(5 * TimeMs.Buffer);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);
         console.info('yyy ' + JSON.stringify(timer2.info));

         switch (startStop[0]) {
            case Source.Host:
               timerH.start();
               break;
            case Source.Viewer1:
               timer1.start();
               break;
            case Source.Viewer2:
               timer2.start();
               break;
         }

         console.info('yyy ' + JSON.stringify(timer2.info));
         await sleep(5 * TimeMs.Buffer);

         console.info('yyy ' + JSON.stringify(timer2.info));
         expect(timerH.running).to.be.true;
         expect(timer1.running).to.be.true;
         expect(timer2.running).to.be.true;

         expect(timerH.ticking).to.be.true;
         expect(timer1.ticking).to.be.true;
         expect(timer2.ticking).to.be.true;

         switch (startStop[1]) {
            case Source.Host:
               timerH.stop();
               break;
            case Source.Viewer1:
               timer1.stop();
               break;
            case Source.Viewer2:
               timer2.stop();
               break;
         }

         await sleep(TimeMs.Buffer);

         expect(timerH.running).to.be.false;
         expect(timer1.running).to.be.false;
         expect(timer2.running).to.be.false;

         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;
      });
   });

   [
      Source.Host,
      Source.Viewer1,
      Source.Viewer2
   ].forEach((source: Source) => {

      it('should synchronize duration values. Change source:' + source, async function () {
         let { squintHost, squintViewers } = await createSession(2);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);

         let durationMs = 10;
         switch (source) {
            case Source.Host:
               timerH.durationMs = durationMs;
               break;
            case Source.Viewer1:
               timer1.durationMs = durationMs;
               break;
            case Source.Viewer2:
               timer2.durationMs = durationMs;
               break;
         }

         await sleep(TimeMs.Buffer);

         expect(timerH.durationMs).to.equal(durationMs);
         expect(timer1.durationMs).to.equal(durationMs);
         expect(timer2.durationMs).to.equal(durationMs);

         expect(timerH.running).to.be.false;
         expect(timer1.running).to.be.false;
         expect(timer2.running).to.be.false;

         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;

         expect(timerH.remainingMs).to.equal(durationMs);
         expect(timer1.remainingMs).to.equal(durationMs);
         expect(timer2.remainingMs).to.equal(durationMs);
      });
   });

   [
      [Source.Host, Source.Host],
      [Source.Host, Source.Viewer1],
      [Source.Host, Source.Viewer2],
      [Source.Viewer1, Source.Host],
      [Source.Viewer1, Source.Viewer1],
      [Source.Viewer1, Source.Viewer2],
      [Source.Viewer2, Source.Host],
      [Source.Viewer2, Source.Viewer1],
      [Source.Viewer2, Source.Viewer2],
   ].forEach((source: Source[]) => {

      it('should synchronize duration values while running. start:' + source[0] + ' change:' + source[1], async function () {
         let { squintHost, squintViewers } = await createSession(2);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);
         let durationMs = 100;

         switch (source[1]) {
            case Source.Host:
               timerH.start();
               break;
            case Source.Viewer1:
               timer1.start();
               break;
            case Source.Viewer2:
               timer2.start();
               break;
         }

         let sw = new Stopwatch();
         let promise = new Promise((resolve, reject) => {
            [timerH, timer1, timer2].forEach((timer) => {
               timer.onAlarm = (sound: boolean) => {
                  try {
                     if (timer === timerH) console.info('TimerH ' + sw.elapsedMs);
                     if (timer === timer1) console.info('Timer1 ' + sw.elapsedMs);
                     if (timer === timer2) console.info('Timer2 ' + sw.elapsedMs);
                     expect(sound).to.be.true;
                     if (timerH.alarmSounding && timer1.alarmSounding && timer2.alarmSounding) {
                        expect(sw.elapsedMs).to.be.greaterThan(durationMs);
                        expect(sw.elapsedMs).to.be.lessThan(2 * durationMs);
                        resolve();

                        timerH.stopAlarm();
                        timer1.stopAlarm();
                        timer2.stopAlarm();
                     }
                  }
                  catch (err) {
                     reject(err);
                  }
               };
            });
         })

         switch (source[1]) {
            case Source.Host:
               timerH.durationMs = durationMs;
               break;
            case Source.Viewer1:
               timer1.durationMs = durationMs;
               break;
            case Source.Viewer2:
               timer2.durationMs = durationMs;
               break;
         }

         return promise;
      });
   });

   [
      [Source.Host, Source.Host],
      [Source.Host, Source.Viewer1],
      [Source.Host, Source.Viewer2],
      [Source.Viewer1, Source.Host],
      [Source.Viewer1, Source.Viewer1],
      [Source.Viewer1, Source.Viewer2],
      [Source.Viewer2, Source.Host],
      [Source.Viewer2, Source.Viewer1],
      [Source.Viewer2, Source.Viewer2],
   ].forEach((startStop: Source[]) => {

      it('should stop all alarms when one stops. start:' + startStop[0] + ' stop:' + startStop[1], async function () {
         let { squintHost, squintViewers } = await createSession(2);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);
         let durationMs = 10;

         switch (startStop[0]) {
            case Source.Host:
               timerH.durationMs = durationMs;
               timerH.start();
               break;
            case Source.Viewer1:
               timer1.durationMs = durationMs;
               timer1.start();
               break;
            case Source.Viewer2:
               timer2.durationMs = durationMs;
               timer2.start();
               break;
         }

         await sleep(durationMs + TimeMs.Buffer);

         expect(timerH.alarmSounding).to.be.true;
         expect(timer1.alarmSounding).to.be.true;
         expect(timer2.alarmSounding).to.be.true;
         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;

         switch (startStop[1]) {
            case Source.Host:
               timerH.stopAlarm();
               break;
            case Source.Viewer1:
               timer1.stopAlarm();
               break;
            case Source.Viewer2:
               timer2.stopAlarm();
               break;
         }

         await sleep(TimeMs.Buffer);

         expect(timerH.alarmSounding).to.be.false;
         expect(timer1.alarmSounding).to.be.false;
         expect(timer2.alarmSounding).to.be.false;
         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;
      });
   });

   [
      [Source.Host, Source.Host],
      [Source.Host, Source.Viewer1],
      [Source.Host, Source.Viewer2],
      [Source.Viewer1, Source.Host],
      [Source.Viewer1, Source.Viewer1],
      [Source.Viewer1, Source.Viewer2],
      [Source.Viewer2, Source.Host],
      [Source.Viewer2, Source.Viewer1],
      [Source.Viewer2, Source.Viewer2],
   ].forEach((source: Source[]) => {

      it('should handle a durationMs value of 0. set duration:' + source[0] + ' start:' + source[1], async function () {
         let { squintHost, squintViewers } = await createSession(2);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);
         let durationMs = 0;

         switch (source[0]) {
            case Source.Host:
               timerH.durationMs = durationMs;
               break;
            case Source.Viewer1:
               timer1.durationMs = durationMs;
               break;
            case Source.Viewer2:
               timer2.durationMs = durationMs;
               break;
         }

         // all synchronization events
         await sleep(TimeMs.Buffer);

         expect(timerH.alarmSounding).to.be.false;
         expect(timer1.alarmSounding).to.be.false;
         expect(timer2.alarmSounding).to.be.false;
         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;

         switch (source[1]) {
            case Source.Host:
               timerH.start();
               break;
            case Source.Viewer1:
               timer1.start();
               break;
            case Source.Viewer2:
               timer2.start();
               break;
         }

         await sleep(TimeMs.Buffer);

         expect(timerH.alarmSounding).to.be.true;
         expect(timer1.alarmSounding).to.be.true;
         expect(timer2.alarmSounding).to.be.true;
         expect(timerH.ticking).to.be.false;
         expect(timer1.ticking).to.be.false;
         expect(timer2.ticking).to.be.false;

         timerH.stopAlarm();
         timer1.stopAlarm();
         timer2.stopAlarm();
      });
   });

   [
      Source.Host,
      Source.Viewer1,
      Source.Viewer2
   ].forEach((source: Source) => {

      it('should sound all alarms at the same time. Started: ' + source, async function () {
         let { squintHost, squintViewers } = await createSession(2);

         let timerH = new ModelTimer(squintHost);
         let timer1 = new ModelTimer(squintViewers[0]);
         let timer2 = new ModelTimer(squintViewers[1]);
         let durationMs = 100;

         let sw = new Stopwatch();
         // TODO test fails if this line is uncommented. Make this a real test
         //timerH.start();

         let promise = new Promise((resolve, reject) => {
            [timerH, timer1, timer2].forEach((timer) => {
               timer.onAlarm = (sound: boolean) => {
                  try {
                     if (timer === timerH) console.info('TimerH ' + sw.elapsedMs);
                     if (timer === timer1) console.info('Timer1 ' + sw.elapsedMs);
                     if (timer === timer2) console.info('Timer2 ' + sw.elapsedMs);
                     expect(sound).to.be.true;
                     if (timerH.alarmSounding && timer1.alarmSounding && timer2.alarmSounding) {
                        expect(sw.elapsedMs).to.be.greaterThan(durationMs);
                        expect(sw.elapsedMs).to.be.lessThan(2 * durationMs);
                        resolve();

                        timerH.stopAlarm();
                        timer1.stopAlarm();
                        timer2.stopAlarm();
                     }
                  }
                  catch (err) {
                     reject(err);
                  }
               };
            });
         })

         switch (source) {
            case Source.Host:
               timerH.durationMs = durationMs;
               timerH.start();
               break;
            case Source.Viewer1:
               timer1.durationMs = durationMs;
               timer1.start();
               break;
            case Source.Viewer2:
               timer2.durationMs = durationMs;
               timer2.start();
               break;
         }

         return promise;
      });
   });


   it('an alarm timeout should not cause other alarms to stop', async function () {
   });

   it('should be able to synchronize to a stopped session', async function () {

      let { squintHost, sessionId } = await createSession();
      let newSquintViewer = await createSquint(TestUrlLocalhost, 'TestNewViewer')

      let timerH = new ModelTimer(squintHost);
      timerH.durationMs = 345423;

      // let synch events pass before joining the session
      await sleep(TimeMs.Buffer);

      await newSquintViewer.joinSession(sessionId);
      let timerV = new ModelTimer(newSquintViewer);

      expect(timerH.durationMs).not.to.equal(timerV.durationMs);

      // TODO if this is timerH, the stop call doesn't work
      timerV.synchronizeFromServer();

      await sleep(TimeMs.Buffer);

      expect(timerH.durationMs).to.equal(timerV.durationMs);
      expect(timerH.running).to.equal(timerV.running);

      timerH.stop();
      timerV.stop();
   });


   it('should be able to synchronize to a running session', async function () {

      let { squintHost, sessionId } = await createSession();
      let newSquintViewer = await createSquint(TestUrlLocalhost, 'TestNewViewer')

      let timerH = new ModelTimer(squintHost);
      timerH.durationMs = 345423;
      timerH.start();

      // let synch events pass before joining the session
      await sleep(TimeMs.Buffer);

      await newSquintViewer.joinSession(sessionId);
      let timerV = new ModelTimer(newSquintViewer);

      expect(timerH.durationMs).not.to.equal(timerV.durationMs);

      // TODO if this is timerH, the stop call doesn't work
      timerV.synchronizeFromServer();

      await sleep(TimeMs.Buffer);

      expect(timerH.durationMs).to.equal(timerV.durationMs);
      expect(timerH.running).to.equal(timerV.running);

      timerH.stop();
      timerV.stop();
   });


   it('should be initialized to 20 minutes', async function () {

   });

   it('should alternate between 20 and 7 minutes', async function () {

   });

   it('should reset to the initial duration if a non standard time is used', async function () {

   });
});
