(function () {

    "use strict";

    var currentCSRFToken;

    var CSRFConfig = {
        useParameterMode: true,

        givenCSRFTokenHeaderName: "X-CSRF-TOKEN",

        CSRFTokenParameterName: "_csrf",

        methodUsingCSRF: {
            get: false,
            post: true,
            delete: false,
            head: false
        }
    };

    angular.module("realtoner.auth.csrf", [])

        .factory("csrfInterceptor", [function () {

            var onResponse = function (config) {

            };

            return {
                response: onResponse,
                responseError: onResponse
            };
        }])

        .provider("csrfHttp", function () {

            /**
             * set use CSRF paramter mode. default is true.
             * Parameter mode means CSRF token is sent as parameter not header field.
             * */
            this.setUseCSRFParameterMode = function (flag) {
                CSRFConfig.useParameterMode = !!flag;
            };

            /**
             * set the given CSRF token(from server)'s header name. Default value is 'X-CSRF-TOKEN'.
             * */
            this.setCSRFHeaderName = function (headerName) {
                CSRFConfig.givenCSRFTokenHeaderName = headerName;
            };

            this.setCSRFTokenParameterName = function (parameterName) {
                CSRFConfig.CSRFTokenParameterName = parameterName;
            };

            this.setUseCSRFOnGet = function(flag){
                CSRFConfig.methodUsingCSRF.get = !!flag;
            };

            this.setUseCSRFOnPost = function(flag){
                CSRFConfig.methodUsingCSRF.post = !!flag;
            };

            this.$get = ["$http", function ($http) {

                var csrfHttp = function(requestObj){

                    requestObj.method = (requestObj.method || "get").trim().toLowerCase();

                    if(currentCSRFToken && CSRFConfig.useParameterMode &&
                        CSRFConfig.methodUsingCSRF[requestObj.method]) {
                        requestObj.data = requestObj.data || {};
                        requestObj.data[CSRFConfig.CSRFTokenParameterName] = currentCSRFToken;
                    }else if(currentCSRFToken && !CSRFConfig.useParameterMode &&
                        CSRFConfig.methodUsingCSRF[requestObj.method]){
                        //add csrf token on http header
                    }

                    return $http(requestObj);
                };

                csrfHttp.get = function(requestObj){
                    requestObj.method = "get";
                    return this(requestObj);
                };

                csrfHttp.post = function(requestObj){
                    requestObj.method = "post";
                    return this(requestObj);
                };

                return csrfHttp;
            }];
        });
})();