const fs = require('fs');
const uuidv4 = require('uuid/v4');
const path = require('path');
const {SHOTS, RAW, META} = require('../../artifacts.config');
const scrollTo = require('../util/scrollTo');
const getRect = require('../util/getRect');

module.exports = function captureImage(selector)
{

    let name = this.name;
    let driver = this.driver;
    let by = this.by;
    let crop;
    let element;
    let id = uuidv4();

    let grabElement = (elem) => new Promise(function(resolve, reject) {
        element = elem;
        resolve();
    });

    let grabElementDimensions = (data) => new Promise(function(resolve, reject) {
        crop = data;
        resolve();
    });

    let writeFile = (name, data, format) => new Promise(function(resolve, reject) {
        fs.writeFile(name, data, format, (err) => {
            if (err) reject(error);
            resolve();
        });
    });

    return driver.findElement(by.css(selector))
        .then(grabElement)
        .then(() => driver.executeScript(scrollTo, selector))
        .then(() => driver.executeScript(getRect, selector))
        .then(grabElementDimensions)
        .then(() => writeFile(path.join(SHOTS, META, `${id}.json`), JSON.stringify(Object.assign(crop, {name, id})), 'utf8'))
        .then(() => driver.takeScreenshot())
        .then((data) => writeFile(path.join(SHOTS, RAW, `${id}.png`), data, 'base64'));

};
