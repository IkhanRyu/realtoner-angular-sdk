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

                        return request;
                    },

                    response : function(response){
                        var csrfToken = response.headers(CSRFConfig.givenCSRFTokenHeaderName);

                        if(csrfToken){
                            currentCSRFToken = csrfToken;
                        }

                        return response;
                    },
                    responseError : function(rejection){
                        var csrfToken = rejection.headers(CSRFConfig.givenCSRFTokenHeaderName);

                        if(csrfToken){
                            currentCSRFToken = csrfToken;
                        }

                        return rejection;
                    }
                };
            }];
        }]);
})();