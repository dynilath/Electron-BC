import { BrowserWindow } from 'electron';
import settings from 'electron-settings';

type WinStateType = {
    x?: number,
    y?: number,
    width: number,
    height: number,
    isMaximized?: boolean,
};

export class windowStateKeeper {
    window: BrowserWindow | undefined = undefined;


    windowState: WinStateType;
    windowName: string;


    constructor(windowName: string, option?: WinStateType) {
        this.windowName = windowName;
        this.windowState = option || {
            width: 1000,
            height: 800
        };
        this.setBounds();
    }

    setBounds() {
        if (settings.hasSync(`windowState.${this.windowName}`)) {
            this.windowState = settings.getSync(`windowState.${this.windowName}`) as any;
            return;
        }
    }

    saveState() {
        if (this.window === undefined) return;
        if (!this.windowState.isMaximized) {
            Object.assign(this.windowState, this.window.getBounds());
        }
        this.windowState.isMaximized = this.window.isMaximized();
        settings.setSync(`windowState.${this.windowName}`, this.windowState);
    }

    track(win: BrowserWindow) {
        this.window = win;
        win.on('resize', () => { this.saveState(); });
        win.on('move', () => { this.saveState(); });
        win.on('close', () => { this.saveState(); });
    }

    getBound() {
        return {
            ...this.windowState
        }
    }
}