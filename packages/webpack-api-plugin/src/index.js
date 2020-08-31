import Path from 'path';
import {cacheDecorator} from './util';
import {WebpackRecursiveLoaderPlugin, defaultGetFileName, normalizeFilePattern, toQueryString} from 'webpack-recursive-loader';

export class WebpackApiClientPlugin {
    static nextIdent = 0;

    constructor({ root, publicPath='/', impl, include=undefined, exclude=undefined, getName=defaultGetFileName }) {
        if(root == null)
            throw new Error(`Option 'root' is required`);
        if(impl == null)
            throw new Error(`Option 'impl' is required`);
        this.root = root;
        this.publicPath = publicPath;
        this.impl = impl;
        this.include = normalizeFilePattern(include, true);
        this.exclude = normalizeFilePattern(exclude, false);
        this.getName = getName;
        this.ident = WebpackApiClientPlugin.nextIdent++;
    }

    get name(){
        return WebpackApiClientPlugin.name;
    }

    _makeFile(path, type){
        return {
            basename: Path.basename(path),
            path,
            absPath: Path.join(this.root, path),
            type
        };
    }

    _getPrefixForFile(file){
        if(file.path === '.')
            return this.publicPath;
        let parent = this._makeFile(Path.dirname(file.path), 'directory');
        parent = this._getPrefixForFile(parent);
        if(parent == null)
            return null;
        if(!this.include(file))
            return null;
        if(this.exclude(file))
            return null;
        let name = this.getName(file);
        return Path.join(parent, name);
    }

    apply(compiler) {
        compiler.hooks.normalModuleFactory.tap(this.name, factory => {
            factory.hooks.afterResolve.tap(this.name, data => {
                let path = data.userRequest;
                if(!path.startsWith(this.root))
                    return;
                path = Path.relative(this.root, path);
                if(path.startsWith('../'))
                    return;
                let file = this._makeFile(path, 'file');
                let prefix = this._getPrefixForFile(file);
                if(prefix == null)
                    return;
                data.loaders.unshift({
                    loader: require.resolve('./client-loader.js'),
                    ident: this.ident,
                    options: {
                        prefix,
                        impl: this.impl
                    }
                });
            });
        });
    }
}
WebpackApiClientPlugin.prototype._getPrefixForFile = cacheDecorator(file => `${file.type},${file.path}`)(WebpackApiClientPlugin.prototype._getPrefixForFile);

export class WebpackApiServerPlugin {
    static keyword = '_webpackApiPluginServerRecursive';

    constructor({ root, include=undefined, exclude=undefined, namespace=undefined, getName=defaultGetFileName }) {
        this.root = root;
        this._recursivePlugin = new WebpackRecursiveLoaderPlugin({
            keyword: WebpackApiServerPlugin.keyword,
            namespace,
            include,
            exclude,
            getName
        });
    }

    get name(){
        return WebpackApiClientPlugin.name;
    }

    apply(compiler){
        compiler.hooks.normalModuleFactory.tap(this.name, normalModuleFactory => {
            normalModuleFactory.hooks.beforeResolve.tap({
                name: this.name,
                stage: 1
            }, data => {
                let request = data.request;
                let match = /^webpack-api-plugin\/api(?:\?(.+))?/.exec(request);
                if(match == null)
                    return;
                let query = toQueryString({
                    [WebpackApiServerPlugin.keyword]: this._recursivePlugin.namespace
                });
                data.request = `${this.root}?${query}`;
            });
        });

        this._recursivePlugin.apply(compiler);
    }
}
