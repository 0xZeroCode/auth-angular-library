"use strict";

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
          return true;
        }

        return this.nextHandler.handle(error);
      }
    };

    var redirectionHandler = {
      nextHandler: finalHandler,

      handle: function (error) {
        if (error.status === 302) {
          $window.location.href = error.data.Location;
          return true;
        }

        return this.nextHandler.handle(error);
      }
    };

    internalErrorHandler.nextHandler = redirectionHandler;

    return internalErrorHandler;
  }]);

}

var tokenKey = 'Authorization';

function checkToken($cookies, $http, failHandlerChain, $routeParams, ContentType) {
  if (!$routeParams || !$routeParams.authorization) {
    return checkFromCookies($cookies, $http, failHandlerChain, ContentType);
  }

  $cookies.put(tokenKey, $routeParams.authorization);

  return $cookies.get(tokenKey);
}

function checkFromCookies($cookies, $http, failHandlerChain, ContentType) {
  var token = $cookies.get(tokenKey);

  if (token) return token;

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
  ContentType = ContentType || 'application/json'; //default is json
  return {headers: {'Authorization': tokenHeader, 'Content-Type': ContentType}};
}
