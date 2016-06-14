define(function(require) {
	var ko = require('knockout'),
		enums = ko.observable({}),
		setEnums = function(enumsObj) {
			enums(enumsObj);
		},
		getEnums = function () {
			return enums();
		},
		getEnumKey = function(enumName, value) {
			var eNum = getEnums()[enumName];
			if (eNum) {
				for (var a in eNum) {
					if (eNum[a] === value)
						return a;
				}
			}
		},
		getEnumI18nKey = function (enumName, value) {
			var eNum = getEnums()[enumName];
			if (eNum) {
				for (var a in eNum) {
					if (eNum[a] === value)
						return 'enums.' + enumName + '.' + a;
				}
			}
		};
	return {
		getEnumKey: getEnumKey,
		setEnums: setEnums,
		getEnums: getEnums,
		getEnumI18nKey: getEnumI18nKey 
	};
}); 