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