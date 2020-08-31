import {getHandler} from 'webpack-api-plugin-server-utils';

export default function ElectronIpcMainServerImpl(apiGetter){
    return async function(event, path, ...args){
        console.log(apiGetter());
        let handler = getHandler(apiGetter(), path);
        if(handler == null)
            throw new Error('Invalid path');
        return await handler(...args);
    };
}