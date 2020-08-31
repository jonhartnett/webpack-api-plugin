export default function XhrClientImpl(path, key, ...args){
    if(key != null)
        path = `${path}/${key}`;
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            if(xhr.status >= 200 && xhr.status < 300){
                let responseType = xhr.getResponseHeader('Content-Type');
                if(!/^application\/json($|;)/.test(responseType))
                    reject(new Error(`Unexpected response type '${responseType}'`));
                resolve(JSON.parse(xhr.responseText));
            }else{
                reject(new Error());
            }
        };
        xhr.open('POST', path);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(args));
    });
}