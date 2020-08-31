export default function ElectronIpcRendererClientImpl(path, key, ...args){
    if(key != null)
        path = `${path}/${key}`;
    return window.ipcRenderer.invoke('api', path, ...args);
}