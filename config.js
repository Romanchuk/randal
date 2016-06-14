define(function (require) {
	var _ = require('underscore'),
        fileConfig = require('config'),
        config = _.clone(fileConfig),

        get = function (key) {
            var keyArr = key.split('.');
            var resultValue = config;
            for (var i = 0; i < keyArr.length; ++i) {
                var keyResult = resultValue[keyArr[i]];
                if (keyResult === undefined) {
                    resultValue = undefined;
                    break;
                }
                else 
                    resultValue = resultValue[keyArr[i]];
            }
            return resultValue;
        },

        load = function (conf) {
        	config = _.extend(config, conf);
        };

	return {
		get: get,
		load: load
	};
});