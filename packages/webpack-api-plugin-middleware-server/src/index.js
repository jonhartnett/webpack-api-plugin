import {json} from 'body-parser';
import {promisify} from 'util';
import {getHandler} from 'webpack-api-plugin-server-utils';

function asyncMiddleware(middleware){
    let wrapper = function(req, res, next){
        this::middleware(req, res, next)
            .catch(next);
    };
    Object.defineProperties(wrapper, Object.getOwnPropertyDescriptors(middleware));
    return wrapper;
}

export default function MiddlewareServerImpl(apiGetter){
    let jsonAsync = promisify(json());
    return asyncMiddleware(async function(req, res, next){
        await jsonAsync(req, res);
        let {path, body: args} = req;
        let handler = getHandler(apiGetter(), path);
        if(handler == null)
            throw new Error('Invalid path');
        let value = await handler(...args);
        value = JSON.stringify(value);
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(value)
        });
        res.end(value);
    });
}