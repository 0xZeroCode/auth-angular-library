'use strict';

function failHandlerChainFactory(app) {

  app.factory('failHandlerChain', ['$cookies', '$window', function ($cookies, $window) {

    var finalHandler = {
      handle: function () {
        return false;
      }
    };

    var internalErrorHandler = {
      nextHandler: finalHandler,

      handle: function (error) {
        if (error.status === 500) {
          console.error(error);
          return;
        }

        this.nextHandler.handle(error);
      }
    };

    var redirectionHandler = {
      nextHandler: finalHandler,

      handle: function (error) {
        if (error.status === 302) {
          $window.location.href = error.data.Location;
          return;
        }

        this.nextHandler.handle(error);
      }
    };

    internalErrorHandler.nextHandler = redirectionHandler;

    return internalErrorHandler;
  }]);

}

var tokenKey = 'Authorization';

function checkToken($cookies, $http, failHandlerChain, ContentType) {
  var token = $cookies.get(tokenKey);

  if (token) return;

  refreshToken($http, failHandlerChain, ContentType);
}

function refreshToken($http, failHandlerChain, ContentType) {
  ContentType = ContentType || 'application/json'; //default is json

  $http.post('/TokenRefresh', {}, getAuthHeaderConfig(null, ContentType))
    .catch(function (error) {
      if (failHandlerChain.handle(error)) return;
      console.error(error);
    });
}

function getAuthHeaderConfig(tokenHeader, ContentType) {
  return {headers: {'Authorization': tokenHeader, 'Content-Type': ContentType}};
}
