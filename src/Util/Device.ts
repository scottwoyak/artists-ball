import { UAParser } from 'ua-parser-js';

export class Device
{
    private parser = new UAParser(navigator.userAgent);

    public constructor() {
        //alert(JSON.stringify(this.parser.getResult(), null, ' '));
    }

    public get isMobile(): boolean {
        return this.parser.getDevice().type === 'mobile';
    }

    public get isFirefox(): boolean {
        return this.parser.getBrowser().name === 'Firefox';
    }

    public get isSafari(): boolean {
    return this.parser.getBrowser().name === 'Safari';
    }

    public get isPortrait(): boolean {
        return (window.orientation !== undefined && window.orientation === 0 || window.orientation === 180);
    }

    public get isIPhone(): boolean {
        return this.parser.getDevice().model === 'iPhone';
    }
}