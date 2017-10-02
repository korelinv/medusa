const fs = require('fs');
const path = require('path');
const jimp = require('jimp');

module.exports = function crop({META, RAW, CANDIDATE}) {

    let importMeta = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
    let cropPromise = (shot, {x, y, width, height, name}) => new Promise(function(resolve, reject) {
        shot.crop(x, y, width, height).write(path.join(CANDIDATE, `${name}.png`), resolve);
    })

    let files = fs.readdirSync(META)
        .map((file) => {
            let meta = importMeta(path.join(META, file));

            return jimp.read(path.join(RAW, `${meta.id}.png`))
                       .then((shot) => cropPromise(shot, meta));
        });

    return Promise.all(files);
};
