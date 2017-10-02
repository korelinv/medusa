module.exports = function getRect(selector) {
    return document.querySelector(selector).getBoundingClientRect();
};
