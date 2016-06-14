define(function (require) {
	var _ = require('underscore'),
		ko = require('ko'),
		registerComponents = function(components) {
			_.each(components, function (vm, name) {
				if (!ko.components.isRegistered(name)) {
					ko.components.register(name, vm);
				}
			});
		},
        boot = function (router, appBootstrapper) {
            if (!appBootstrapper)
                return true;

		    if (appBootstrapper.components)
			    registerComponents(appBootstrapper.components);
		    if (appBootstrapper.routes)
		        router.map(appBootstrapper.routes);

		    return appBootstrapper.load ? bs.load() : true;
	    };

	return {
		boot: boot
	};
});