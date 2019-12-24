'use strict';

/**
 * Global variables, visible only inside background.js
 */
var counter = 0;

/**
 * Run this code every second
 */
setInterval(function () {
    getAllTabs(function (tabs) {
        dcl(tabs);
    });
    dcl(`${counter++} s since installation/reload`);
}, 1000);


/**
 * Block nasty requests
 */
chrome.webRequest.onBeforeRequest.addListener(function (details) {
    let parser, domain, domainBlocked;
    let tabId = details.tabId;

    // Get domain (hostname) from URL
    parser = document.createElement('a');
    parser.href = details.url;
    domain = parser.hostname;
    dcl(details.type + ' - ' + domain);

    domainBlocked = DOMAINS_FORBIDDEN.indexOf(domain) >= 0;

    if (domainBlocked) {
        chrome.browserAction.setBadgeText({
            tabId: tabId,
            text: 'XXX'
        });
        return {cancel: true};
    } else {
        return {cancel: false};
    }

    // Block the request if domain matches no whitelisted domain
    if (domainBlocked.domainBlocked) {
      return {cancel: true};
    } else {
      return {cancel: false};
    }
    },
    {urls: ['*://*/*']},
    ['blocking']
);

/**
 * Context menu
 */
chrome.contextMenus.removeAll();
chrome.contextMenus.create(
    {
        id: 'contextMenu',
        title: 'Chrome Extension Starter Kit',
        type: 'normal',
        contexts: ['image'],
        onclick: function (info, tab) {
            chrome.tabs.create({url: 'https://www.google.com/search?&tbm=isch&q=' + encodeURI(info.srcUrl)});
        }
    }
);
