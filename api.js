define(function (require) {
    require('JSON');
    var eventable = {};
    require('durandal/events').includeIn(eventable);
    var
        amplify = require('amplify'),
        Q = require('q'),
        _ = require('underscore'),
        endpoint = require('config').endpoint,
        adfs = require('randal/adfs'),
        requestAborter = require('randal/requestAborter'),
        queue = [],
		refreshTokenInProgress = false,
        defaults = {
        	dataType: 'json',
        	xhrFields: {
        		withCredentials: true
        	},
        	decoder: 'randal'
        },

        resources = {},

        addResource = function (name, settings) {
        	resources[name] = settings;
        },

        addResources = function (newResources) {
        	resources = _.extend(resources, newResources);
        },

        getSettings = function (resourceId) {
        	var settings = resources[resourceId] || 'GET';
        	if (typeof settings == 'string') {
        		settings = { type: settings };
        	}

        	return settings;
        },

        getType = function (resourceId) {
        	return getSettings(resourceId).type;
        },
        addEndpoint = function (url, customEndpoint) {
        	if (url.indexOf('/') !== 0) {
        		url = '/' + url;
        	}

        	return (customEndpoint || endpoint) + url;
        },

        setEndpoint = function (url) {
        	endpoint = url;
        },
        defineRequest = function (resourceId, customEndpoint) {
        	var settings = getSettings(resourceId);

        	settings.url = addEndpoint(resourceId, customEndpoint);

        	return amplify.request.define(resourceId, 'ajax', _.extend(defaults, settings));
        },
		innerDefer = function (settings, loop) {
			loop = loop === null ? 0 : loop + 1;

			var deferred = Q.defer(),
				promise = deferred.promise;

			if (settings.forceRefresh) {
				settings.data = settings.data || {};
				settings.data.forceToken = new Date().getTime();
			}

			if (typeof (settings.data) === 'object' && getType(settings.resourceId) !== 'GET') {
				settings.data = JSON.stringify(settings.data);
			}

			//prepare array fields for GET
			if (typeof (settings.data) === 'object' && getType(settings.resourceId) === 'GET') {
				for (var k in settings.data) {
					if (settings.data[k] instanceof Array)
						settings.data[k] = JSON.stringify(settings.data[k]);
				}
			}

			if (loop === 0) {
			    eventable.trigger('before', promise);

				promise.finally(function () {
				    eventable.trigger('completed', promise);
				});
			}

			if (!amplify.request.resources[settings.resourceId]) {
				defineRequest(settings.resourceId, settings.customEndpoint);
			}

			if (settings.abortProcessing) {
			    requestAborter.abort('api', settings.resourceId);
			}

			var r = amplify.request({
				resourceId: settings.resourceId,
				data: settings.data,
				success: function (response) {
				    deferred.resolve(response);
				    eventable.trigger('succeeded', response);
				},
				error: function (response) {
				    deferred.reject(response);
				    eventable.trigger('failed', response);
				    eventable.trigger('failed:' + response.status, response);
				}
			});
			promise.abort = r.abort;

			if (settings.abortProcessing)
			    requestAborter.add('api', settings.resourceId, promise);

			return promise.catch(function (error) {
				if (error.status === 401) {
					if (loop > 0) {
						return adfs.logout()
							.then(adfs.login)
							.then(function () { return innerDefer(settings, loop); }, cancelRequests);
					}

					if (refreshTokenInProgress) {
						return pushQueue()
							.then(function () { return innerDefer(settings, loop); });
					} else {
						refreshTokenInProgress = true;
						return adfs.refreshToken()
							.then(function () { return innerDefer(settings, loop); })
							.then(continueProcessRequests, cancelRequests);
					}
				}

				return Q.reject(error);
			});
		},
        defer = function (resourceId, data, options, customEndpoint, abortProcessing) {
            var forceRefresh;
            if (typeof (options) === "object") {
                forceRefresh = options.forceRefresh;
                customEndpoint = options.endpoint;
                abortProcessing = options.abortProcessing;
            } else
                forceRefresh = options;

	        return innerDefer({
		        resourceId: resourceId,
		        data: data,
		        forceRefresh: forceRefresh,
		        customEndpoint: customEndpoint,
		        abortProcessing: abortProcessing
	        }, null, this);
        },

        //registers global error handler
        onError = function (callback) {
        	return amplify.subscribe('request.error', callback);
        },

        offError = function (callback) {
        	return amplify.unsubscribe('request.error', callback);
        };

	amplify.request.decoders.randal = function (data, status, ampXHR, success, error) {
		var mes;
		if (status === 'success') {
			success(data);
		} else if (status === 'abort') {
			error({ message: 'aborted', originalMessage: ampXHR.responseText, status: -1 }, -1);
		} else if (ampXHR.status === 200 && status === 'parsererror') { //void response
			success();
		}
		else {
		    if (ampXHR.status === 503) { //service unavaliable error, server returns html response by default
		        mes = { message: 'serverUnavaliable', originalMessage: ampXHR.responseText, status: 503 };
		    } else if (ampXHR.status === 403) {
	            try {
	                mes = JSON.parse(ampXHR.responseText);
	            } catch (exception) {
	                mes = { message: 'forbidden', originalMessage: ampXHR.responseText, status: ampXHR.status };
	            }
	        } else { //service application error
	            try { //normal error can be parsed
	                mes = JSON.parse(ampXHR.responseText);
	            } catch (exception) { //something wrong
	                mes = { message: 'unknownError', originalMessage: ampXHR.responseText, status: ampXHR.status };
	            }
	        }
	        error(mes, ampXHR.status);
	    }
	};

	function cancelRequests(data) {
		refreshTokenInProgress = false;
		var p;
		while (p = queue.shift()) p.reject();
		return Q(data);
	}

	function continueProcessRequests(data) {
		refreshTokenInProgress = false;
		var p;
		while (p = queue.shift()) p.resolve();
		return Q(data);
	}

	function pushQueue() {
		return Q.Promise(function (resolve, reject) { queue.push({ resolve: resolve, reject: reject }); });
	}

    return _.extend(eventable, {
        defer: defer,
        setEndpoint: setEndpoint,
        defineRequest: defineRequest,
        addResource: addResource,
        addResources: addResources,
        onError: onError,
        offError: offError
    });
});