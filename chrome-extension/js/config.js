'use strict';

/*
 * Common variables and constants
 */
const DEVELOPMENT_MODE = !('update_url' in chrome.runtime.getManifest());
const DOMAINS_FORBIDDEN = [
    'example.com',
];
