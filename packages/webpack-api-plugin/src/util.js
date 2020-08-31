export function* map(func){
    let i = 0;
    for(let value of this)
        yield this::func(value, i++);
}

export function* filter(func){
    let i = 0;
    for(let value of this){
        if(this::func(value, i++))
            yield value;
    }
}

export function cacheDecorator(keyFunc, cacheKey=Symbol('cache')){
    return function(func){
        let wrapper = function(){
            let cache = this[cacheKey];
            if(cache == null)
                cache = this[cacheKey] = new Map();
            let key = this::keyFunc(...arguments);
            if(cache.has(key))
                return cache.get(key);
            let value = this::func(...arguments);
            cache.set(key, value);
            return value;
        };
        //copy name, length, etc.
        Object.defineProperties(wrapper, Object.getOwnPropertyDescriptors(func));
        return wrapper;
    };
}
