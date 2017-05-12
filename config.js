define(function (require) {
    require('JSON');

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
            if (resultValue instanceof Object) //clone object
                return JSON.parse(JSON.stringify(resultValue));
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
