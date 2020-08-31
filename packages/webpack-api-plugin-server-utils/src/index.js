import { has } from './util';

export function getHandler(api, path){
    path = path.split('/').filter(Boolean);
    if(path.length === 0)
        return null;
    let handler = api;
    for(let key of path){
        if(handler == null || typeof handler !== 'object')
            return null;
        if(!handler::has(key))
            return null;
        handler = handler[key];
    }
    if(!(handler instanceof Function))
        return null;
    return handler;
}