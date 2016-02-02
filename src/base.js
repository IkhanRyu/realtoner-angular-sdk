(function () {

    "use strict";

    String.prototype.startsWith = function () {

        if (arguments.length == 1) {
            return this.indexOf(arguments[0]) === 0;

        } else if (arguments.length > 1 && typeof arguments[0] == "string") {
            return arguments[0].indexOf(arguments[1]) === 0;
        }

        return false;
    };

    String.prototype.endsWith = function () {

        if (arguments.length == 1) {
            return this.indexOf(arguments[0]) === (this.length - arguments[0].length);

        } else if (arguments.length > 1) {
            return arguments[0].indexOf(arguments[1]) === (arguments[0].length - arguments[1].length);
        }

        return false;
    };

    angular.isPromise = function (promise) {

        return angular.isObject(promise) &&
            promise.then instanceof Function &&
            promise["catch"] instanceof Function &&
            promise["finally"] instanceof Function;
    };

    angular.module("realtoner.base", [
        "ngCookies"
    ])

        .provider("httpRequester", [function () {

            var config = {};

            this.setBaseUrl = function (url) {
                config.url = url;
            };

            this.$get = [function () {
                return null;
            }];
        }])

        .provider("session", [function () {

            var config = {};

            var sessionMap = {};
            var numOfSessions = 0;
            var lruQueue, endOfQueue;

            var sessionTimeout;
            var sessionMaxTimeout;
            var sessionMaxSize;

            var init = function () {

                sessionTimeout = (config.defaultTimeout || 36000) * 1000;
                sessionMaxTimeout = (config.maxTimeout || 72000) * 1000;
                sessionMaxSize = config.sessionMaxSize || 1024;
            };

            this.setSessionDefaultTimeout = function (sec) {
                config.defaultTimeout = sec;
            };

            this.setSessionMaxTimeout = function (sec) {
                config.maxTimeout = sec;
            };

            this.setSessionMaxSize = function (sessionMaxSize) {
                config.sessionMaxSize = sessionMaxSize;
            };

            this.$get = ["$timeout" , function ($timeout) {

                function Session(key, data, timeout, time) {
                    this.key = key;
                    this.data = data;
                    this.timeout = timeout;
                    this.time = time;
                }

                function LRUQueueUnit(pre, next, session) {
                    this.pre = pre;
                    this.next = next;
                    this.session = session;
                }

                var createSession = function (key, data, time) {

                    return new Session(key, data, $timeout(function () {
                        removeSession(key);
                    }, time), time);
                };

                var addData = function (key, data, time) {

                    removeData(key);

                    time = time ? time * 1000 : sessionTimeout;

                    if (time > sessionMaxTimeout)
                        time = sessionMaxTimeout;

                    if (numOfSessions > sessionMaxSize) {
                        deleteOldSessions();
                    }

                    addSession(key, data, time);
                };

                var addSession = function (key, data, time) {

                    var newSession = createSession(key, data, time);

                    sessionMap[key] = newSession;
                    newSession.queueUnit = createLRUQueueUnit(newSession);
                    addToFrontOfLRUQueue(newSession.queueUnit);

                    numOfSessions++;
                };

                var createLRUQueueUnit = function (session) {
                    return new LRUQueueUnit(null, null, session);
                };

                var addToFrontOfLRUQueue = function (queueUnit) {

                    if (!lruQueue)
                        lruQueue = endOfQueue = queueUnit;
                    else {
                        lruQueue.pre = queueUnit;
                        queueUnit.next = lruQueue;
                        queueUnit.pre = null;

                        lruQueue = queueUnit;
                    }
                };

                var deleteQueueUnitFromQueue = function (queueUnit) {

                    if (queueUnit.pre)
                        queueUnit.pre.next = queueUnit.next;
                    else
                        lruQueue = queueUnit.next;

                    if (queueUnit.next)
                        queueUnit.next.pre = queueUnit.pre;
                    else
                        endOfQueue = queueUnit.pre;
                };

                var moveQueueUnitToFrontOfLRUQueue = function (queueUnit) {

                    deleteQueueUnitFromQueue(queueUnit);
                    addToFrontOfLRUQueue(queueUnit);
                };

                var deleteOldSessions = function () {

                    var i = 0;
                    var end = Math.floor(sessionMaxSize / 10);
                    var queueUnit = endOfQueue;

                    while (i < end && queueUnit) {
                        removeSession(queueUnit.session.key);

                        queueUnit = queueUnit.pre;
                        queueUnit.next = null;
                        endOfQueue = queueUnit;

                        i++;
                    }
                };

                var getData = function (key) {

                    if (sessionMap[key]) {
                        var session = sessionMap[key];

                        $timeout.cancel(session.timeout);
                        session.timeout = $timeout(function () {
                            removeSession(key);
                        }, session.time);

                        moveQueueUnitToFrontOfLRUQueue(session.queueUnit);

                        return session.data;
                    }
                };

                var removeSession = function (key) {

                    var session;
                    var queueUnit;

                    session = sessionMap[key];
                    queueUnit = session.queueUnit;

                    $timeout.cancel(session.timeout);

                    if (queueUnit == lruQueue && queueUnit == endOfQueue) {
                        lruQueue = endOfQueue = null;

                    } else if (queueUnit == lruQueue) {
                        lruQueue = queueUnit.next;
                        lruQueue.pre = null;

                    } else if (queueUnit == endOfQueue) {
                        endOfQueue = queueUnit.pre;
                        endOfQueue.next = null;

                    } else {
                        queueUnit.pre.next = queueUnit.next;
                        queueUnit.next.pre = queueUnit.pre;
                    }

                    sessionMap[key] = null;
                    numOfSessions--;
                };

                var removeData = function (key) {

                    if (sessionMap[key]) {
                        removeSession(key);
                    }
                };

                init();

                return {
                    addData: addData,
                    addShortData : function(key , data){
                        addData(key , data , 30);
                    },
                    getData: getData,
                    removeData: removeData,
                    printQueue: function () {

                        var str = "";
                        var tempUnit = lruQueue;

                        while (tempUnit) {
                            str += "->" + tempUnit.session.key;
                            tempUnit = tempUnit.next;
                        }

                        return str;
                    }
                };
            }];
        }])

        .factory("httpBuffer", ["$injector" , function ($injector) {

            var bufferMap = {};

            var $http;

            var retryHttpRequest = function (config, deferred) {
                function successCallback(response) {
                    deferred.resolve(response);
                }

                function errorCallback(response) {
                    deferred.reject(response);
                }

                $http = $http || $injector.get("$http");
                $http(config).then(successCallback, errorCallback);
            };

            var retry = function (buffer, updater) {

                if (buffer) {
                    updater = updater || function (config) {
                            return config;
                        };

                    for (var i = 0; i < buffer.length; i++)
                        retryHttpRequest(updater(buffer[i].config), buffer[i].deferred);
                }
            };

            var reject = function (buffer, reason) {

                if (buffer && reason)
                    for (var i = 0; i < buffer.length; i++)
                        buffer[i].deferred.reject(reason);
            };

            return {
                append: function (key, config, deferred, token) {

                    var buffer = bufferMap[key] || [];

                    buffer.push({
                        config: config,
                        deferred: deferred,
                        token: token
                    });

                    if (!bufferMap[key])
                        bufferMap[key] = buffer;
                },
                retryAll: function (key, updater) {

                    var buffer = bufferMap[key];

                    retry(buffer, updater);

                    bufferMap[key] = [];
                },
                retryAllWithoutGivenToken: function (key, updater, token) {

                    var buffer = bufferMap[key];
                    var newBuffer = [];

                    if (buffer) {

                        for (var i = 0; i < buffer.length; i++)
                            if (!buffer[i].token || buffer[i].token !== token)
                                newBuffer.push(buffer[i].config, buffer[i].deferred);
                    }

                    retry(newBuffer, updater);

                    bufferMap[key] = [];
                },
                rejectAll: function (key, reason) {

                    var buffer = bufferMap[key];

                    reject(buffer, reason);

                    bufferMap[key] = [];
                },
                rejectAllWithoutGivenToken: function (key, reason, token) {

                    var buffer = bufferMap[key];
                    var newBuffer = [];

                    if (buffer)
                        for (var i = 0; i < buffer.length; i++)
                            if (!buffer[i].token || buffer[i].token !== token)
                                newBuffer.push(buffer[i].config, buffer[i].deferred);

                    reject(buffer, reason);

                    bufferMap[key] = [];
                }
            };
        }])

        .factory("dateUtil" , [function(){
            return {
                convert : function(date){
                    if(date instanceof Date){
                        return new Date(date.toTime() + date.getTimezoneOffset());
                    }else{
                        var d = new Date(date);

                        return new Date(d.getTime() - d.getTimezoneOffset() * 1000 * 60);
                    }
                }
            };
        }]);
})();
