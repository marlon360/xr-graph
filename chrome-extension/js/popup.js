'use strict';

/**
 * Global variables, visible only inside popup.js
 */
let backgroundJS = chrome.extension.getBackgroundPage();


/**
 * Render a list of all audible tabs
 */
let renderTabsAudible = function () {
    getAllTabsAudible(function(tabs) {
        for (let tab of tabs) {
            let html = `
                        <div class="tab" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
                            <div class="tab__item tab__title" title="${tab.title}">${tab.title}</div>
                            <div class="tab__item tab__url" title="${tab.url}">${tab.url}</div>
                            <a href="" tabindex="-1" class="tab__item tab__focus">focus</a>
                            <a href="" tabindex="-1" class="tab__item tab__close">close</a>
                        </div>
                       `;
            document.querySelector('.js-tabs-audible').innerHTML += html;
        }
    });
};


/**
 * RUN
 */
renderTabsAudible();


/**
 * Event listeners
 */
document.querySelector('.js-tabs-audible').addEventListener('click', function (e) {
    e.preventDefault();

    let targetEl = e.target;

    // React to clicks on tab items only
    if (targetEl.matches('.tab__item')) {
        let tabEl = targetEl.closest('.tab');
        let tabId = parseInt(tabEl.dataset.tabId);
        let windowId = parseInt(tabEl.dataset.windowId);

        // Focus selected window/tab
        if (targetEl.matches('.tab__focus')) {
            chrome.windows.update(windowId, {focused: true});
            chrome.tabs.update(tabId, {active: true});
        }

        // Close selected tab
        if (targetEl.matches('.tab__close')) {
            chrome.tabs.remove(tabId, function(){
                document.querySelector(`.js-tabs-audible .tab[data-tab-id="${tabId}"]`).remove();
            });
        }
    }
});
