define(function () {
    var system = require('durandal/system'),
        getQueryParamsSafe = function (instr) {
			if (!instr)
			    system.log("Are you sure router has been activated?");
		    return instr.queryParams || {};
		},
		getQueryParamValue = function(instr, key) {
			return getQueryParamsSafe(instr)[key];
		};

	return {
		getQueryParamsSafe: getQueryParamsSafe,
		getQueryParamValue: getQueryParamValue
	};
});