define(function (require) {
	var
		Q = require('q'),
		config = require('randal/config'),
		logoutUrl = config.get('urls.logout'),
		loginUrl = config.get('urls.login');

	return {
		login: login,
		logout: logout,
		refreshToken: refreshToken
	};

	function login() {
		var deferred = Q.defer(),
			promise = deferred.promise;

		addEvent(window, 'message', receiveMessage);
		var frame = window.open(loginUrl, 'Запрос авторизации', 'height=600,width=1250,top=100,left=50,modal=yes,alwaysRaised=yes');

		function receiveMessage(event) {
			if (event.origin === window.location.origin && event.data && event.data.opened) {

				removeEvent(window, 'message', receiveMessage);
				frame.close();

				deferred.resolve();
			}
		}

		return promise;
	}

	function logout() {
		return callAdfs(logoutUrl);
	}

	function refreshToken() {
		return callAdfs(loginUrl);
	}

	function callAdfs(url) {
		var deferred = Q.defer(),
			promise = deferred.promise;

		addEvent(window, 'message', receiveMessage);
		var frame = getFrame(url);
		var timeouts = [];
		frame.onload = function () {
			timeouts.push(setTimeout(function () {
				window.document.body.removeChild(frame);
				removeEvent(window, 'message', receiveMessage);
				deferred.resolve();
			}, 5000));
		};

		window.document.body.appendChild(frame);

		return promise;

		function receiveMessage(event) {
			if (event.origin === window.location.origin && event.data && event.data.opened) {
				for (var i = 0; i < timeouts.length; ++i)
					clearTimeout(timeouts[i]);
				timeouts = [];

				removeEvent(window, 'message', receiveMessage);
				window.document.body.removeChild(frame);

				deferred.resolve();
			}
		}
	}

	function getFrame(url) {
		var frame = window.document.createElement('iframe');
		frame.style.display = 'none';
		frame.setAttribute('src', url);
		return frame;
	}

	function addEvent(el, event, callback) {
		if (el.attachEvent) //if IE (and Opera depending on user setting)
			el.attachEvent('on' + event, callback);
		else if (el.addEventListener) //WC3 browsers
			el.addEventListener(event, callback, false);
	}

	function removeEvent(el, event, callback) {
		if (el.detachEvent) //if IE (and Opera depending on user setting)
			el.detachEvent('on' + event, callback);
		else if (el.removeEventListener) //WC3 browsers
			el.removeEventListener(event, callback, false);
	}
});