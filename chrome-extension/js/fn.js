'use strict';

/**
 * Development Console.Log
 *
 * @param value Value to log
 */
let dcl = function (value) {
    if (DEVELOPMENT_MODE) {
        console.log(value);
    }
};

/**
 * Get all tabs
 *
 * @param cb Callback function accepting `tabs` parameter
 */
let getAllTabs = function(cb) {
    chrome.tabs.query({}, function (tabs) {
        cb(tabs);
    });
};

/**
 * Get all audible tabs
 *
 * @param cb Callback function accepting `tabs` parameter
 */
let getAllTabsAudible = function(cb) {
    chrome.tabs.query({audible: true}, function (tabs) {
        cb(tabs);
    });
};
