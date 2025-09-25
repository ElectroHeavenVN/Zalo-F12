// ==UserScript==
// @name         ZaloUtils
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  UserScript contains various utilities for Zalo Web version.
// @author       ElectroHeavenVN
// @match        https://chat.zalo.me/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zalo.me
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    var wsHookInstalled = false;
    var httpHookInstalled = false;
    var prefix = '/';
    var ZWSWebpack, ZEncoderWebpack, ZDomainsWebpack, ZHttpWebpack;

    var oldEndpoint = '';
    var newEndpoint = '';

    let enableAntidelete = false;

    function InstallHooks() {
        const originalAddEventListener = WebSocket.prototype.addEventListener;
        WebSocket.prototype.addEventListener = function (...args) {
            originalAddEventListener.apply(this, arguments);
            if (wsHookInstalled)
                return;
            ZWSWebpack = window.webpackJsonp.push([[Math.random()], {}, [["8RMw"]]]);
            wsHookInstalled = true;
            AntiRecall();
        }
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
            if (oldEndpoint !== '' && newEndpoint !== '' && url.startsWith(oldEndpoint)) {
                originalOpen.apply(this, [method, newEndpoint + url.substring(oldEndpoint.length), async, user, password]);
                newEndpoint = '';
                oldEndpoint = '';
            }
            else {
                originalOpen.apply(this, arguments);
            }
            if (httpHookInstalled)
                return;
            if (!url.includes("api/login/getLoginInfo") && !url.includes("api/login/getServerInfo"))
                return;
            httpHookInstalled = true;
            ZEncoderWebpack = window.webpackJsonp.push([[Math.random()], {}, [["z0WU"]]]);
            ZDomainsWebpack = window.webpackJsonp.push([[], {}, [["pUq9"]]]);
            ZHttpWebpack = window.webpackJsonp.push([[Math.random()], {}, [["fBUP"]]]);
            ModifyEncodeAES();
            MockGroupSetting();
            DisableSendDelivered();
        }
    }
    function DisableSendDelivered() {
        ZHttpWebpack.default.sendDeliveredV2 = function(e) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
        ZHttpWebpack.default.sendGroupDeliveredV2 = function(e) {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
    }

    function AntiRecall() {
        function modifyPayload(message) {
            if (message.uidFrom === '0')
                return; // Skip my own messages
            if (message.msgType === 'chat.undo' || message.msgType === 'chat.delete') {
                let content = Array.isArray(message.content) ? message.content[0] : message.content;
                message.quote = {
                    attach: '{"properties":{"color":0,"size":0,"type":0,"subType":0,"ext":"{\\"shouldParseLinkOrContact\\":0}"},"msgBubbleLayoutType":0}',
                    cliMsgId: content.cliMsgId ?? content.clientDelMsgId,
                    cliMsgType: 1,
                    fromD: "AntiRecall",
                    globalMsgId: content.globalMsgId ?? content.clientDelMsgId,
                    msg: "Jump to message",
                    ownerId: content.srcId ?? content.uidFrom,
                    ts: content.cliMsgId ?? content.clientDelMsgId,
                    ttl: 0,
                };
                message.content = message.msgType === 'chat.undo' ? 'Message recalled' : 'Message deleted';
                message.msgType = 'webchat';
            }
        }
        ZWSWebpack.default._onData_original = ZWSWebpack.default._onData;
        ZWSWebpack.default._onData = async (opCode, command, version, data) => {
            if (data.includes('"msgType":"chat.undo"') || data.includes('"msgType":"chat.delete"')) {
                let jsonPayload = JSON.parse(data);
                jsonPayload.data.msgs.forEach(modifyPayload);
                jsonPayload.data.groupMsgs.forEach(modifyPayload);
                jsonPayload.data.pageMsgs.forEach(modifyPayload);
                return await ZWSWebpack.default._onData_original(opCode, command, version, JSON.stringify(jsonPayload));
            }
            return await ZWSWebpack.default._onData_original(opCode, command, version, data);
        };
    }
    function ModifyEncodeAES() {
        function modifyPayload(payload) {
            let propName = "";
            if (payload.includes('"message":"'))
                propName = 'message';
            else if (payload.includes('"msg":"'))
                propName = 'msg';
            else if (payload.includes('"desc":"'))
                propName = 'desc';
            if (propName) {
                let json = JSON.parse(payload);
                let message = json[`${propName}`];
                if (typeof message !== 'string')
                    return payload;
                let msgArr = message.split(' ');
                if (msgArr.length < 1)
                    return payload;
                HandleAntiDelete(json);
                // [{prefix} + command] [args]
                if (HandleCommands(json, propName, msgArr[0], ...msgArr.slice(1)))
                    return JSON.stringify(json);
                if (enableAntidelete)
                    return JSON.stringify(json);
                return payload;
            }

            if (payload.includes('"msgs":[')) {
                let p = JSON.parse(payload);
                for (let msg of p.msgs) {
                    if (Math.abs(Date.now() - parseInt(msg.cliMsgId)) >= 1000 * 60 * 60 * 24) {
                        msg.cliMsgId = String(Date.now() - 5000);
                    }
                }
                return JSON.stringify(p);
            }
            if (payload.includes('"cliMsgIdUndo":"')) {
                let p = JSON.parse(payload);
                if (Math.abs(Date.now() - parseInt(p.cliMsgIdUndo)) >= 1000 * 60 * 60 * 24)
                    p.cliMsgIdUndo = String(Date.now() - 5000);
                return JSON.stringify(p);
            }

            return payload;
        }
        ZEncoderWebpack.default.encodeAES_original = ZEncoderWebpack.default.encodeAES;
        ZEncoderWebpack.default.encodeAES = (e, t = 0) => {
            try {
                e = modifyPayload(e);
            }
            catch { }
            return ZEncoderWebpack.default.encodeAES_original(e, t);
        };
    }
    function HandleAntiDelete(json) {
        if (!enableAntidelete)
            return;
        if (typeof json.clientId === 'string') {
            json.clientId = String(Number(json.clientId) + 90000000);
        }
        else if (typeof json.clientId === 'number') {
            json.clientId = Math.floor(json.clientId + 90000000);
        }
    }

    function HandleCommands(json, propName, command, ...params) {
        let result = true;
        if (command === prefix + 'ttl' && params.length > 0) {
            let ttl = parseInt(params[0]);
            if (isNaN(ttl) || ttl < 200) {
                return false;
            }
            let originalMessage = params.slice(1).join(' ');
            if (propName == "message" && originalMessage.length == 0)
                return false;
            let commandLength = command.length + params[0].length + 2;  //2 spaces
            json[propName] = originalMessage;
            json.ttl = ttl;
            if (json.mentionInfo) {
                let mentions = JSON.parse(json.mentionInfo);
                for (let mention of mentions) {
                    mention.pos -= commandLength;
                }
                json.mentionInfo = JSON.stringify(mentions);
            }
        }
        else if (command === prefix + 'antidelete' && params.length == 1 && propName == "message" && (params[0] === 'on' || params[0] === 'off')) {
            if (params[0] === 'on') {
                enableAntidelete = true;
            }
            else if (params[0] === 'off') {
                enableAntidelete = false;
            }
            json[propName] = `Antidelete is now ${enableAntidelete ? 'enabled' : 'disabled'}.`;
            json.ttl = 60000;
        }
        else if (command === prefix + 'antidelete') {
            let originalMessage = params.slice(0).join(' ');
            if (propName == "message" && originalMessage.length == 0)
                return false;
            let commandLength = command.length + 1; // 1 space
            json[propName] = originalMessage;
            if (typeof json.clientId === 'string') {
                json.clientId = String(Number(json.clientId) + 90000000);
            }
            else if (typeof json.clientId === 'number') {
                json.clientId = Math.floor(json.clientId + 90000000);
            }
            if (json.mentionInfo) {
                let mentions = JSON.parse(json.mentionInfo);
                for (let mention of mentions) {
                    mention.pos -= commandLength;
                }
                json.mentionInfo = JSON.stringify(mentions);
            }
        }
        else if (command === prefix + 'id' && propName == "message" && params.length > 0 && json.mentionInfo) {
            let mentions = JSON.parse(json.mentionInfo);
            if (mentions.length !== 1)
                return false;
            let originalMessage = params.slice(0).join(' ');
            originalMessage = originalMessage.substring(1, originalMessage.length);
            if (originalMessage.length == 0)
                return false;
            json[propName] = originalMessage + `'s ID: ${mentions[0].uid}`;
            json.mentionInfo = "[]";
            json.ttl = 60000;
        }
        else if (command === prefix + 'thread' && propName == "message" && params.length == 0) {
            if (json.grid)
                json[propName] = `Group ID: ${json.grid}`;
            else if (json.toid)
                json[propName] = `User ID: ${json.toid}`;
            else
                return false;
            json.ttl = 60000;
        }
        else if (command === prefix + 'editquote' && propName == "message" && json.qmsg !== undefined && params.length > 0) {
            let originalMessage = params.slice(0).join(' ');
            if (originalMessage.length == 0 || !originalMessage.includes('|'))
                return false;
            let newQuote = originalMessage.split('|')[0];
            originalMessage = originalMessage.split('|')[1];
            if (json.qmsgType === 1)
                json.qmsg = newQuote;
            if (json.qmsgAttach) {
                let qmsgAttach = JSON.parse(json.qmsgAttach);
                qmsgAttach.title = newQuote;
                qmsgAttach.mentions = [];
                json.qmsgAttach = JSON.stringify(qmsgAttach);
            }
            json[propName] = originalMessage;
            let commandLength = command.length + newQuote.length + 2; // 1 for space, 1 for pipe
            if (json.mentionInfo) {
                let mentions = JSON.parse(json.mentionInfo);
                for (let mention of mentions) {
                    mention.pos -= commandLength;
                }
                json.mentionInfo = JSON.stringify(mentions);
            }
        }
        else if (command === prefix + 'quote' && propName == "message" && json.qmsg !== undefined) {
            let originalMessage = params.slice(0).join(' ');
            if (originalMessage.length == 0)
                return false;
            json.qmsgId = 100000 + Math.floor(Math.random() * 100000);
            json.qmsgCliId = String(Number(json.qmsgCliId) * 1000 + Math.floor(Math.random() * 1000));
            let commandLength = command.length + 1; // 1 space
            json[propName] = originalMessage;
            if (json.mentionInfo) {
                let mentions = JSON.parse(json.mentionInfo);
                for (let mention of mentions) {
                    mention.pos -= commandLength;
                }
                json.mentionInfo = JSON.stringify(mentions);
            }
        }
        else if (command === prefix + 'stk' && propName !== "message") {
            //photo
            let threadId = json.toid || json.grid;
            let threadType = json.toid ? 0 : 1;
            let ttl = json.ttl ?? 0;
            let clientId = json.clientId ?? Date.now();
            let imei = json.imei ?? "";
            let msgType = 2;
            let url = json.rawUrl || json.hdUrl || json.oriUrl;
            let width = json.width || 0;
            let height = json.height || 0;
            let msgInfo = {
                title: "",
                oriUrl: url,
                thumbUrl: url,
                hdUrl: "",
                url: url,
                width: width,
                height: height,
                properties: '{\"color\":-1,\"size\":-1,\"type\":3,\"subType\":0,\"ext\":\"{\\\"sSrcType\\\":-1,\\\"sSrcStr\\\":\\\"\\\",\\\"msg_warning_type\\\":0}\"}',
                normalUrl: "",
            }
            Object.keys(json).forEach(key => delete json[key]);
            if (threadType) {
                json.grid = threadId;
                json.visibility = 0;
            }
            else
                json.toId = threadId;
            json.ttl = ttl;
            json.zsource = 704;
            json.msgType = msgType;
            json.clientId = String(clientId);
            json.msgInfo = JSON.stringify(msgInfo);
            json.imei = imei;
            json.decorLog = "{}";   //"{\"fw\":{\"pmsg\":{\"st\":2,\"ts\":1751126840920,\"id\":\"d69e348509a35015c431204c15fa5f89\"},\"rmsg\":{\"st\":2,\"ts\":1751126840920,\"id\":\"d69e348509a35015c431204c15fa5f89\"},\"fwLvl\":1}}"
            oldEndpoint = ZDomainsWebpack.b.mappingDomain.get('file').activeDomain.trim() + '/api/' + (threadType ? 'group' : 'message') + '/photo_original/send';
            newEndpoint = ZDomainsWebpack.b.mappingDomain.get('file').activeDomain.trim() + '/api/' + (threadType ? 'group' : 'message') + '/forward';
        }
        else if (command === prefix + 'help' && propName == "message" && params.length == 0) {
            json[propName] =
                'ZaloUtils - Developed by ElectroHeavenVN\n' +
                'Available commands:\n' +
                prefix + 'ttl <milliseconds> [message] - Send a disappearing message\n' +
                prefix + 'antidelete on/off - Enable or disable antidelete feature\n' +
                prefix + 'antidelete [message] - Send a message that cannot be deleted\n' +
                prefix + 'id <@mention> - Get ID of mentioned user\n' +
                prefix + 'thread - Get ID of current chat thread\n' +
                prefix + 'editquote <quote content> | <message> - Edit quote of current message\n' +
                prefix + 'quote - Make quoted message visible even if it was deleted\n' +
                prefix + 'stk - Send media as sticker\n' +
                prefix + 'help - Show this help message';
            json.ttl = 60000;
        }
        else
            result = false;
        return result;
    }
    function MockGroupSetting() {
        ZEncoderWebpack.default.decodeAES_original = ZEncoderWebpack.default.decodeAES;
        ZEncoderWebpack.default.decodeAES = (e, t = 0) => {
            var n = ZEncoderWebpack.default.decodeAES_original(e, t);
            try {
                let json = JSON.parse(n);
                if (json?.error_code == 0) {
                    if (json.data?.gridInfoMap) {
                        for (let grid in json.data.gridInfoMap) {
                            let group = json.data.gridInfoMap[grid];
                            if (group.setting) {
                                group.setting.lockViewMember = 0; // Allow viewing group members
                                group.setting.signAdminMsg = 1; // Mark admin messages
                            }
                            if (group.adminIds) {
                                let myID = ZEncoderWebpack.default.userIdMe();
                                if (!group.adminIds.includes(myID)) {
                                    group.adminIds.push(myID);
                                }
                            }
                        }
                    }
                }
                n = JSON.stringify(json);
            }
            catch (e) { }
            return n;
        };
    }
    InstallHooks();
})();