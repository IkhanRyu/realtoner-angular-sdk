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