import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('PromptAPI', {
  onPrompt: (cb: (data: any) => void) => {
    ipcRenderer.on('prompt-data', (_e, data) => cb(data));
  },
  sendResult: (result: any) => {
    ipcRenderer.send('prompt-result', result);
  },
  log: (data: string) => {
    ipcRenderer.send('log', data);
  },
});

declare global {
  interface Window {
    PromptAPI: {
      onPrompt: (cb: (data: any) => void) => void;
      sendResult: (result: any) => void;
      log: (data: string) => void;
    };
  }
}
