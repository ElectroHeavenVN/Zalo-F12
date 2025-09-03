// ==UserScript==
// @name         ZaloDecryptor
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Decrypt and log Zalo's HTTP requests and WebSocket traffics
// @author       ElectroHeavenVN
// @match        https://chat.zalo.me/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zalo.me
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/ElectroHeavenVN/Zalo-F12/main/Userscripts/ZaloDecryptor.user.js
// @downloadURL  https://raw.githubusercontent.com/ElectroHeavenVN/Zalo-F12/main/Userscripts/ZaloDecryptor.user.js
// ==/UserScript==

(function () {
    'use strict';

    const KnownOpCodes = {
        AUTHEN: 1,
        PING: 2,
        PING_ACTIVE: 4,
        PUSH_MSG_1_1: 501,
        CLEAR_UNREADS_1_1: 504,
        CLEAR_UNREADS_GROUP: 524,
        PULL_MSG_1_1: 510,
        PULL_MSG_GROUP: 511,
        MSG_PC: 513,
        MSG_WEB: 515,
        MSG_GROUP: 514,
        SESSION_PC: 516,
        SESSION_WEB: 517,
        ACK_DELIVERED: 518,
        ACK_DELIVERED_GROUP: 519,
        PUSH_MSG_GROUP: 521,
        PUSH_STATUS_1_1: 502,
        PUSH_STATUS_GROUP: 522,
        VERIFY_MSG: 532,
        HAS_MSG: 533,
        PUSH_MISS_MSG: 534,
        GET_MSG: 570,
        PRELOAD: 571,
        GET_STATUS_MSG: 575,
        GET_STATUS_MSG_GROUP: 576,
        GET_LAST_DELIVER_SEEN: 577,
        GET_LAST_SEEN_SUB_CHAT_TAB: 578,
        MAX_CONNECTION: 3e3,
        SUBMIT_INTERACTIVE_FILE: 536,
        PULL_LIST_INTERACTIVE_FILE: 537,
        PUSH_LIST_INTERACTIVE_FILE: 530,
        CTRL_TESTING: 600,
        CTRL_ACTION: 602,
        CTRL_PUSH_REACT: 612,
        CTRL_PUSH_CLEAR_REACT: 613,
        CTRL_PULL_REACT: 610,
        CTRL_PULL_REACT_BIG_GR: 611,
        CTRL_GET_LAST_SEEN_REACT: 614,
        CTRL_PUSH_CTRL: 601,
        CTRL_PULL_CTRL: 603,
        CTRL_PULL_VOIP: 604,
        CLOUD: {
            PUSH: 620,
            NEED_VERIFY: 621,
            DONE_MIGRATE: 623
        },
        GET_IN_APP_PAYMENT_LINK: 701
    };

    const KnownSignalOpCodes = {
        INIT: {
            SUBMIT_BUNDLE: 540,
            GET_BUNDLE: 541,
            SUBMIT_PREKEYS: 542,
            INIT_SESSION: 543,
            SESSION_OFFLINE: 516,
            SESSION_OFFLINE_WEB: 517,
            OFFLINE_ACK_ONE_ONE: 518,
            OFFLINE_ACK_GROUP: 519,
            ACK_INIT_SESSION: 544,
            INIT_SESSION_MOBILE: 545,
            DELETE_KEY: 547,
            NOTIFY_DELETE_KEY: 548,
            REQUEST_PREKEYS: 549,
            CHECK_COMPATIBLE: 560,
            INIT_SESSION_GROUP: 561,
            CHECK_COMPATIBLE_GROUP: 562,
            GET_LIST_USER_E2EE: 563,
            GET_KEY_ID: 564,
            DISABLE_E2EE: 580,
            ENABLE_E2EE: 581,
            ACK_PROCESS_INIT_GROUP_FAILED: 559,
            ACK_GROUP_SESSIONS_STALE: 546,
            DOWNGRADE_E2EE_GROUP: 582
        },
        MSG: {
            RECEIVE_ONEONE: 551,
            RECEIVE_GROUP: 552,
            PUSH_MISS: 535
        },
        MSG_OFFLINE: {
            RECEIVE_GROUP_OFFLINE: 514
        },
        ACK: {
            DONE_PROCESS_SESSION: 545,
            SUBDEVICE_UNSUPPORT: 550,
            DELIVER_SEEN_ONEONE: 553,
            DELIVER_SEEN_GROUP: 554,
            DELETE_QUEUE_ACK_ONEONE: 557,
            DELETE_QUEUE_ACK_GROUP: 558
        }
    };

    const myConsole = {
        debug: console.debug.bind(console),
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        dir: console.dir.bind(console),
        clear: console.clear.bind(console)
    };

    let enableLog = true;

    window.ZaloDecryptor = {
        enableLog: () => { enableLog = true; },
        disableLog: () => { enableLog = false; }
    };

    function debug(name, color, subname, subcolor, content, ...args) {
        myConsole.debug(
            `%c ZaloDecryptor %c %c ${name} %c %c ${subname} %c ${content}`,
            `background: linear-gradient(90deg, #0068ff 0%, white 100%); color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${subcolor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            ...args);
    }

    function log(name, color, subname, subcolor, content, ...args) {
        myConsole.log(
            `%c ZaloDecryptor %c %c ${name} %c %c ${subname} %c ${content}`,
            `background: linear-gradient(90deg, #0068ff 0%, white 100%); color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${subcolor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            ...args);
    }

    function info(name, color, subname, subcolor, content, ...args) {
        myConsole.info(
            `%c ZaloDecryptor %c %c ${name} %c %c ${subname} %c ${content}`,
            `background: linear-gradient(90deg, #0068ff 0%, white 100%); color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${subcolor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            ...args);
    }

    function warn(name, color, subname, subcolor, content, ...args) {
        myConsole.warn(
            `%c ZaloDecryptor %c %c ${name} %c %c ${subname} %c ${content}`,
            `background: linear-gradient(90deg, #0068ff 0%, orange 100%); color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${subcolor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            ...args);
    }

    function error(name, color, subname, subcolor, content, ...args) {
        myConsole.error(
            `%c ZaloDecryptor %c %c ${name} %c %c ${subname} %c ${content}`,
            `background: linear-gradient(90deg, #0068ff 0%, red 100%); color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${color}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            `background: ${subcolor}; color: black; font-weight: bold; border-radius: 5px;`,
            "",
            ...args);
    }

    function findOpCodeName(opcode, obj, prefix = '') {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                const result = findOpCodeName(opcode, obj[key], prefix ? `${prefix}.${key}` : key);
                if (result) return result;
            } else {
                if (obj[key] === opcode) {
                    return prefix ? `${prefix}.${key}` : key;
                }
            }
        }
        return null;
    }

    function getOpCodeName(opcode) {
        return findOpCodeName(opcode, KnownOpCodes) || findOpCodeName(opcode, KnownSignalOpCodes) || 'Unknown';
    }

    let httpHookInstalled = false;
    let wsHookInstalled = false;

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        originalOpen.apply(this, arguments);
        if (httpHookInstalled) return;
        if (!url.includes("api/login/getLoginInfo") && !url.includes("api/login/getServerInfo")) return;
        httpHookInstalled = true;
        myConsole.clear();
        myConsole.log("Installing HTTP hooks...");
        const ZEncoderWebpack = window.webpackJsonp.push([[Math.random()], {}, [["z0WU"]]]);
        const ZHttpWebpack = window.webpackJsonp.push([[Math.random()], {}, [["fBUP"]]]);
        const ZServiceMapWebpack = window.webpackJsonp.push([[Math.random()], {}, [["pUq9"]]]).b;

        ZHttpWebpack.default.original__request = ZHttpWebpack.default._request;
        ZHttpWebpack.default._request = (e, url, n, s, o = 0, r = 0, l = false, A = null) => {
            let result = ZHttpWebpack.default.original__request(e, url, n, s, o, r, l, A);
            if (!enableLog) return result;
            try {
                if (typeof url === 'object')
                    url = ZServiceMapWebpack.getDomainByType(url.domainType) + url.path;
                if (!url.includes("api/login/getLoginInfo") && !url.includes("api/login/getServerInfo")) {
                    result.then(response => {
                        try {
                            // myConsole.dir(response);
                            let encryptedRequestParam;
                            let requestUrl = response.config.url;
                            let method = 'Unknown';
                            let uploadData;
                            if (response.config.method)
                                method = response.config.method.toUpperCase();
                            if (response.config.data) {
                                if (typeof (response.config.data) === 'string')
                                    encryptedRequestParam = response.config.data.split('params=')[1];
                                else if (response.config.data instanceof FormData)
                                    uploadData = Array.from(response.config.data.entries());
                            }
                            if (!encryptedRequestParam && requestUrl.split('?').length > 1) {
                                let urlQueryParams = new URLSearchParams(requestUrl.split('?')[1]);
                                encryptedRequestParam = urlQueryParams.get('params');
                                if (encryptedRequestParam)
                                    requestUrl = requestUrl.split('params=')[0] + 'params= ...';
                            }
                            let requestParam;
                            if (encryptedRequestParam)
                                requestParam = ZEncoderWebpack.default.decodeAES(encryptedRequestParam);
                            else
                                requestParam = '(empty)';
                            let formData = 'Form data:\n%c';
                            if (uploadData) {
                                for (const [key, value] of uploadData) {
                                    if (value instanceof File) {
                                        formData += `[File]%c ${key}: ${value.name}, ${value.size} bytes\n`;
                                    } else if (value instanceof Blob) {
                                        formData += `[Blob]%c ${key}: ${value.size} bytes\n`;
                                    } else {
                                        formData += `%c${key}: ${value}\n`;
                                    }
                                }
                            }
                            else
                                formData = '%c%c';
                            if (response.data.error_code != 0) {
                                debug('HTTP', 'orange', 'Error', 'red', `%c${method} %c${requestUrl}\n%cRequest params:\n%c${requestParam}\n%c${formData}%cAPI return error:\n%c${response.data.error_code}%c: ${response.data.error_message}`, 'color: red', 'color: #45a1ff', 'color: orange', 'font-size: 1.15em', 'color: orange', 'color: lime', '', '', 'color: #yellow; font-size: 1.15em', 'font-size: 1.15em');
                                return;
                            }
                            let responseData;
                            let notes = '';
                            let jsonParseFailed = false;
                            if (typeof response.data.data === "string") {   //some response is not encrypted and the data become an object, we may log them out
                                responseData = ZEncoderWebpack.default.decodeAES(response.data.data);
                                try {
                                    responseData = JSON.parse(responseData);    //For displaying Unicode characters
                                }
                                catch (e) {
                                    jsonParseFailed = true;
                                }
                            }
                            else {
                                responseData = response.data.data;
                                notes = '(not encrypted)';
                            }
                            if (!jsonParseFailed) {
                                responseData = JSON.stringify(responseData);
                            }
                            debug('HTTP', 'orange', method, 'cyan', `%c${requestUrl}%c ${notes}\n%cRequest params:\n%c${requestParam}\n%c${formData}%cResponse:\n%c${responseData}`, 'color: #45a1ff', '', 'color: orange', 'font-size: 1.15em', 'color: orange', 'color: lime', '', 'color: orange', 'font-size: 1.15em');
                        }
                        catch (error) {
                            myConsole.error("Error in response hook: ", error);
                        }
                    });
                }
            }
            catch (error) {
                myConsole.error("Error in HTTP hook: ", error);
            }
            return result;
        }
    };

    const originalAddEventListener = WebSocket.prototype.addEventListener;
    WebSocket.prototype.addEventListener = function (..._args) {
        originalAddEventListener.apply(this, arguments);
        if (!wsHookInstalled) {
            myConsole.log("Installing WebSocket hooks...");
            const ZWSWebpack = window.webpackJsonp.push([[Math.random()], {}, [["8RMw"]]]);
            ZWSWebpack.default.original__onData = ZWSWebpack.default._onData;
            ZWSWebpack.default._onData = (opCode, cmd, ver, jsonData) => {
                if (enableLog) {
                    let reparsedJsonData = JSON.stringify(JSON.parse(jsonData));    //for displaying Unicode characters
                    debug('WebSocket', 'yellow', 'Receive', 'lime', `\n%cOpcode:%c %c${getOpCodeName(opCode)}%c (%c${opCode}%c), %ccommand:%c ${cmd}, %cversion:%c ${ver}\n%c${reparsedJsonData}`, 'color: cyan', '', 'color: orange', '', 'color: yellow', '', 'color: cyan', '', 'color: cyan', '', 'font-size: 1.15em');
                }
                return ZWSWebpack.default.original__onData(opCode, cmd, ver, jsonData);
            };
            const originalSend = WebSocket.prototype.send;
            WebSocket.prototype.send = function (data) {
                originalSend.apply(this, arguments);
                if (!enableLog) return;
                let buffer = new Uint8Array(data.byteLength - 4);
                for (let i = 0; i < data.byteLength - 4; i++) {
                    buffer[i] = data.getInt8(i + 4);
                }
                let jsonData = JSON.stringify(JSON.parse(new TextDecoder().decode(buffer)));    //for displaying Unicode characters
                let opCode = data.getInt16(1, true);
                let cmd = data.getInt8(3);
                let ver = data.getInt8(0);
                debug('WebSocket', 'yellow', 'Send', 'cyan', `\n%cOpcode:%c %c${getOpCodeName(opCode)}%c (%c${opCode}%c), %ccommand:%c ${cmd}, %cversion:%c ${ver}\n%c${jsonData}`, 'color: cyan', '', 'color: orange', '', 'color: yellow', '', 'color: cyan', '', 'color: cyan', '', 'font-size: 1.15em');
            };
            wsHookInstalled = true;
            myConsole.info("%cHooks installed. You can turn logging on or off via the window.ZaloDecryptor object.", 'color: yellow; font-size: 1.5em');
        }
    }
})();