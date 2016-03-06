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