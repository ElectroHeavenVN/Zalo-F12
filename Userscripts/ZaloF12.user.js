// ==UserScript==
// @name         ZaloF12
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Enable Developer mode, E2EE, embeds, Guggy and text file editing in Zalo
// @author       ElectroHeavenVN
// @match        https://chat.zalo.me/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zalo.me
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(() => {
        let ndmk = window.webpackJsonp.push([[Math.random()],{},[["NDmK"]]]).default;
        ndmk.adminMode = 1;
        ndmk.e2ee.enable_group = true;
        ndmk.e2ee.invisible = false;
        ndmk.e2ee.default_11_banner.enable = true;
        ndmk.enable_guggy = 1;
        ndmk.embed_pop.enable_youtube = 1;
        ndmk.embed_pop.enable_soundcloud = 1;
        ndmk.tfe.enable_edit = 1;
    }, 5000);
})();