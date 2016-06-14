define(function (require) {
    var ko = require('knockout'),
        Q = require('q'),
        app = require('durandal/app'),
        enums = require('randal/enums'),
        config = require('randal/config'),
        availableLocales = config.get('locales'),
        localeCookieName = config.get('localeCookieName'),
        User = null,
        getUserCallback = null,
        cookieHelper = require('randal/helpers/cookie'),
        currentUser = ko.observable(),
        currentLocale = ko.observable(''),
        updateUser = function (userData) {
            if (!userData)
	            currentUser(new User());
            else {
            	currentUser(User.mapper.fromDto(userData));
            	if (userData.enums)
            		enums.setEnums(userData.enums);
            }
            app.trigger('user:updated', currentUser());
            return currentUser();
        },
        updateUserData = function(data) {
            if (User == null || getUserCallback == null)
                throw new Error('Please setup Auth module before using it');
            if (data !== undefined) {
                return Q(updateUser(data));
            } else
                return getUserCallback().then(updateUser);
        },
        getDefaultLocale = function() {
            if (availableLocales instanceof Array)
                return availableLocales[0];
            return availableLocales;
        },
        changeLocale = function(lang) {
            if (!(availableLocales instanceof Array))
                availableLocales = [availableLocales];
            if (!lang) {
                var ind = availableLocales.indexOf(currentLocale());
                lang = availableLocales[ind + 1] || availableLocales[0];
            }
            if (typeof (lang) !== 'string')
                return currentLocale();
            lang = lang.toLowerCase();
            if (lang !== currentLocale()) {
                app.trigger('language:beforeChange', lang);
                cookieHelper.set(localeCookieName, lang, Infinity, '/');
                currentLocale(lang);
                app.trigger('language:change', lang);
            }
            return currentLocale();
        },
        setup = function(updateUserCallback, UserModel) {
            User = UserModel || require('randal/model/user');
            getUserCallback = updateUserCallback;
            currentUser(new User());
        },
        reset = function() {
            updateUserData(null);
        };

    var curLocale = cookieHelper.get(localeCookieName);
    currentLocale(curLocale || getDefaultLocale());

    return {
        setup: setup,
        currentUser: currentUser,
        currentLocale: currentLocale,
        changeLocale: changeLocale,
        updateUserData: updateUserData,
        reset: reset
    };
});