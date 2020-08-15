const NUM_COLS = 150;

export class ConsoleCapture {

   private textArea: HTMLTextAreaElement;

   public get visible(): boolean {
      return getComputedStyle(this.textArea).display === 'block';
   }

   public set visible(flag: boolean) {
      this.textArea.style.display = flag ? 'block' : 'none';
   }

   public constructor(id = 'Console', numCols = NUM_COLS) {
      this.textArea = document.createElement('textarea');
      this.textArea.id = id;
      this.textArea.cols = numCols;
      document.body.appendChild(this.textArea);

      // TODO update these all to take the correct arguments for console functions
      let oldLog = console.log;
      console.log = (msg: string) => {
         this.append(msg);
         oldLog(msg);
      }

      let oldTrace = console.trace;
      console.trace = (msg: string) => {
         this.append('TRACE ' + msg);
         oldTrace(msg);
      }

      let oldInfo = console.info;
      console.info = (msg: string) => {
         this.append('INFO ' + msg);
         oldInfo(msg);
      }

      let oldWarn = console.warn;
      console.warn = (msg: string) => {
         this.append('WARN ' + msg);
         oldWarn(msg);
      }

      let oldError = console.error;
      console.error = (msg: string) => {
         this.append('ERROR ' + msg);
         oldError(msg);
      }

      let oldClear = console.clear;
      console.clear = () => {
         this.textArea.textContent = '';
         oldClear();
      }

      let oldOnError = window.onerror;
      window.onerror = (event: string | Event, source: string, lineno: number, colno: number, error: Error) => {
         let stackTrace = error && error instanceof Error ? '\n' + error.stack : '';
         let msg = event + '\n' + source + ' line:' + lineno + ', col:' + colno + stackTrace;
         alert(msg);
         this.append(msg);
      }
   }

   private append(msg: string) {
      let fullmsg = this.textArea.value;

      msg = msg.substr(0, 100 * NUM_COLS)
      fullmsg = msg + '\n\n' + fullmsg;
      fullmsg = fullmsg.substr(0, 10 * 1000 * NUM_COLS);

      this.textArea.value = fullmsg;
   }

   public setEdges(left: number, right: number, top: number, bottom: number) {
      this.textArea.style.left = left + 'px';
      this.textArea.style.right = right + 'px';
      this.textArea.style.top = top + 'px';
      this.textArea.style.bottom = bottom + 'px';
   }
}