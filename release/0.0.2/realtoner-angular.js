(function () {

    "use strict";

    var CONSTANTS = {
        AUTH_REJECTED: "auth-rejected",
        AUTH_FORBIDDEN: "auth-forbidden"
    };

    angular.module("realtoner.auth", [
            "realtoner.base",
            "ngRoute"
        ])

        /**
         *
         * */
        .factory("csrfInterceptor", [function () {
            return {

            };
        }])

        /**
         *
         * */
        .provider("httpWrapper", function () {

            var headerNames = {
                csrfParameter: "",
                csrfToken: ""
            };

            var oauthConfig = {
                use: false
            };

            var csrfConfig = {
                useParameterMode: true,

                givenCSRFTokenHeaderName: "X-CSRF-TOKEN",

                CSRFTokenParameterName: "_csrf",

                MethodUsingCSRF: {
                    get: false,
                    post: true,
                    delete: false,
                    head: false
                }
            };

            var csrfHeaderNames = {};

            /**
             * set use OAuth2 mode. default is false.
             * */
            this.setUseOAuth2Mode = function (flag) {
                oauthConfig = !!flag;
            };

            /**
             * set use CSRF paramter mode. default is true.
             * */
            this.setUseCSRFParameterMode = function (flag) {
                csrfConfig.useParameterMode = !!flag;
            };

            /**
             * set the given CSRF token(from server)'s header name. Default value is 'X-CSRF-TOKEN'.
             * */
            this.setCSRFHeaderName = function (headerName) {
                csrfConfig.givenCSRFTokenHeaderName = headerName;
            };

            this.setCSRFTokenParameterName = function (parameterName) {
                csrfConfig.CSRFTokenParameterName = parameterName;
            };

            this.$get = ["$http", function ($http) {

                var currentCSRFToken;

                return {};
            }];
        })

        .factory("authService", ["$rootScope", "httpBuffer", function ($rootScope, httpBuffer) {
            return {
                loginConfirmed: function (data, configUpdater) {

                    var updater = configUpdater || function (config) {
                            return config;
                        };

                    $rootScope.$broadcast("event:auth-loginConfirmed", data);
                    httpBuffer.retryAll(CONSTANTS.AUTH_REJECTED, updater);
                },
                loginCancelled: function (data, reason) {

                    httpBuffer.rejectAll(CONSTANTS.AUTH_REJECTED, reason);
                    $rootScope.$broadcast('event:auth-loginCancelled', data);
                }
            };
        }])

        .factory("authInterceptor", ["$rootScope", "$q", "httpBuffer", function ($rootScope, $q, httpBuffer) {

            return {
                responseError: function (rejection) {

                    var config = rejection.config || {};

                    if (!config.ignoreAuthModule) {
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

    /**
     * CSRF is Cross-Site Request Forgery. This helps implements CSRF protection in RESTFul
     * application. It assumes that the CSRF token is given as HTTP header. And given CSRF token is
     * put on HTTP parameter or one of headers. At this point, it defines two terminologies. One is
     * 'Parameter mode' and the other is 'Header mode'.
     *
     * Parameter mode sends csrf token on parameter of http request. On the other hand, Header mode
     * sends csrf token on header of http request. Parameter mode is default option for every request.
     *
     * @author RyuIkhan
     * */
    angular.module("realtoner.auth.csrf",[])

        /**
         * 'csrfInterceptor' provides CSRF operation. It intercepts every http request and implements
         * CSRF. For http response, it checks header which has CSRF token and if exists, remember
         * given token. For http request, it puts CSRF token given by http response.
         *
         * It provides some options which be applied to every request.
         *
         * 1. setUseParameterMode {Boolean}
         * 2. setCSRFHeaderNameFromResponse {String}
         * 3. setCSRFTokenParameterName {String}
         * 4. setUseCSRFOn[Get|Post|Delete|Head\ {Boolean}
         *
         * It provides some options for each request. This options just be applied one http request.
         *
         * 1. csrfHeaderName {String} : use given value as header name of csrf token. If this request has this
         *                                  property, that request will be header mode.
         * 2. useCsrf {Boolean} : use csrf in current http request.
         * 3. csrfParameterName {String} : use given value as parameter name of csrf token. If this property is,
         *                                  then current http request use parameter mode.
         * <example>
         *     $http({
         *          url : example.com/sample,
         *          method : 'get',
         *          useCsrf : true,
         *          csrfParameterName : '_x_csrf'
         *     });
         *     </example>
         * */
        .provider("csrfInterceptor",[function(){

            var CSRFConfig = {
                useParameterMode: true,

                givenCSRFTokenHeaderName: "X-CSRF-TOKEN",

                CSRFTokenParameterName: "_csrf",
                CSRFTokenHeaderName : "REQ-CSRF-TOKEN",

                methodUsingCSRF: {
                    get: false,
                    post: true,
                    delete: false,
                    head: false
                }
            };


            /**
             * set use CSRF paramter mode. default is true.
             * Parameter mode means CSRF token is sent as parameter not header field.
             *
             * @param flag {Boolean}
             * */
            this.setUseCSRFParameterMode = function (flag) {
                CSRFConfig.useParameterMode = !!flag;

                return this;
            };

            /**
             * set the given CSRF token(from server)'s header name. Default value is 'X-CSRF-TOKEN'.
             * */
            this.setCSRFHeaderNameFromResponse = function (headerName) {
                CSRFConfig.givenCSRFTokenHeaderName = headerName;

                return this;
            };

            /**
             * set parameter name of csrf token. Default value is '_csrf'.
             *
             * @param parameterName {String}
             * */
            this.setCSRFTokenParameterName = function (parameterName) {
                CSRFConfig.CSRFTokenParameterName = parameterName;

                return this;
            };

            /**
             * set header name of csrf token. Default value is 'REQ-CSRF-TOKEN'.
             *
             * @param headerName {String}
             * */
            this.setCSRFTokenHeaderName = function(headerName){
                CSRFCOnfig.CSRFTokenHeaderName = headerName;

                return this;
            };

            this.setUseCSRFOnGet = function(flag){
                CSRFConfig.methodUsingCSRF.get = !!flag;

                return this;
            };

            this.setUseCSRFOnPost = function(flag){
                CSRFConfig.methodUsingCSRF.post = !!flag;

                return this;
            };

            this.setUseCSRFOnDelete = function(flag){
                CSRFConfig.methodUsingCSRF.delete = !!flag;

                return this;
            };

            this.setUseCSRFOnHead = function(flag){
                CSRFConfig.methodUsingCSRF.head = !!flag;

                return this;
            };

            this.$get = ["$q", function($q){

                var handleRequest = function(request){

                    var method = request.method.toLocaleLowerCase().trim();

                    request.useCsrf = request.useCsrf || CSRFConfig.methodUsingCSRF[method];
                    request.useHeaderMode = request.useHeaderMode || !CSRFConfig.useParameterMode;
                    request.csrfParameterName = request.csrfParameterName || CSRFConfig.CSRFTokenParameterName;

                    if(request.useHeaderMode)
                        request.csrfHeaderName = request.useHeaderMode || CSRFConfig.CSRFTokenHeaderName;
                };

                var currentCSRFToken;

                return {
                    request : function(request){

                        handleRequest(request);

                        if(request.useCsrf){
                            if(request.useHeaderMode){
                                request.headers[request.csrfHeaderName] = currentCSRFToken;
                            }else{
                                request.params = request.params || {};
                                request.params[request.csrfParameterName] = currentCSRFToken;
                            }
                        }

                        return $q.resolve(request);
                    },

                    response : function(response){
                        var csrfToken = response.headers(CSRFConfig.givenCSRFTokenHeaderName);

                        if(csrfToken){
                            currentCSRFToken = csrfToken;
                        }

                        return $q.resolve(response);
                    },
                    responseError : function(rejection){
                        var csrfToken = rejection.headers(CSRFConfig.givenCSRFTokenHeaderName);

                        if(csrfToken){
                            currentCSRFToken = csrfToken;
                        }

                        return $q.reject(rejection);
                    }
                };
            }];
        }]);
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