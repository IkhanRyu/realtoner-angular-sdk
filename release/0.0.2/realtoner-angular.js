(function(){

    "use strict";

    var CONSTANTS = {
        AUTH_REJECTED : "auth-rejected" ,
        AUTH_FORBIDDEN : "auth-forbidden"
    };

    angular.module("realtoner.auth" , [
        "realtoner.base" ,
        "ngRoute"
    ])

        .factory("authService" , ["$rootScope" , "httpBuffer" , function($rootScope , httpBuffer){
            return{
                loginConfirmed: function(data, configUpdater) {

                    var updater = configUpdater || function(config) { return config; };

                    $rootScope.$broadcast("event:auth-loginConfirmed", data);
                    httpBuffer.retryAll(CONSTANTS.AUTH_REJECTED , updater);
                },
                loginCancelled: function(data, reason) {

                    httpBuffer.rejectAll(CONSTANTS.AUTH_REJECTED , reason);
                    $rootScope.$broadcast('event:auth-loginCancelled', data);
                }
            };
        }])

        .factory("authInterceptor" , ["$rootScope" , "$q" , "httpBuffer" , function($rootScope , $q , httpBuffer){

            return {
                responseError : function(rejection){

                    var config = rejection.config || {};

                    if (!config.ignoreAuthModule){
                        var deferred = $q.defer();

                        switch (rejection.status) {
                            case 401:
                                httpBuffer.append(CONSTANTS.AUTH_REJECTED, config, deferred);
                                $rootScope.$broadcast('event:auth-loginRequired', rejection);

                                return deferred.promise;

                            case 403:
                                httpBuffer.append(CONSTANTS.AUTH_FORBIDDEN, config, deferred);
                                $rootScope.$broadcast('event:auth-forbidden', rejection);

                                break;
                        }
                    }

                    return $q.reject(rejection);
                }
            };
        }]);
})();
(function(){

    "use strict";

    angular.module("realtoner.auth.oauth",[])

        .provider("OAuthHttp" ,function(){

            var parameterNames = {
                grantType : "grant_type",
                clientId : "client_id",
                secret : "secret",
                redirectUri : "redirect_uri"
            };

            var urls = {
                authorize : null,
                accessToken : null
            };

            var listeners = {
                onUnAuthorize : function(){

                }
            };

            /*
            * Setters for parameter name
            * */
            this.setGrantTypeParameterName = function(grantType){
                parameterNames.grantType = grantType || parameterNames.grantType;
            };

            this.setClientIdParameterName = function(clientId){
                parameterNames.clientId = clientId || parameterNames.clientId;
            };

            this.setSecretParameterName = function(secret){
                parameterNames.secret = secret || parameterNames.secret;
            };

            this.setRedirectUriParameterName = function(redirectUri){
                parameterNames.redirectUri = redirectUri || parameterNames.redirectUri;
            };

            /*
            * Setters for url.
            * */
            this.setAuthorizeUrl = function(authorizeUrl){
                urls.authorize = authorizeUrl;
            };

            this.setAccessTokenUrl = function(accessTokenUrl){
                urls.accessToken = accessTokenUrl;
            };

            /*
            * Setters for listener
            * */
            this.setOnAuthorize = function(onUnAuthorize){

            };

            this.$get = function(){

                function ClientDetails(){

                }

                var currentClientDetails;
                var currentUserDetails = {
                    principal : null,
                    credential : null
                };

                var OAuthHttp = function(requestObj){

                };

                return OAuthHttp;
            };
        });
})();
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

(function () {

    "use strict";

    angular.module("realtoner.directives", [])

        .directive("currentTime", function ($interval , dateFilter) {

            function link(scope, element, attrs) {
                var format,
                    timeoutId;

                function updateTime() {
                    element.text(dateFilter(new Date(), format));
                }

                scope.$watch(attrs.currentTime, function (value) {
                    format = value;
                    updateTime();
                });

                element.on('$destroy', function () {
                    $interval.cancel(timeoutId);
                });

                // start the UI update process; save the timeoutId for canceling
                timeoutId = $interval(function () {
                    updateTime(); // update DOM
                }, 1000);
            }

            return {
                restrict: "A",
                link: link
            };
        })

        .directive("appSelectBar" , function(){

            var currentPage = 0;
            var pages = [];

            var link = function(scope , element ,attrs){
                scope.getValue = function(){
                    return "fuck";
                };
            };

            return {
                link : link ,
                scope : {
                    value : "="
                }
            };
        });
})();