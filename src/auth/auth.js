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