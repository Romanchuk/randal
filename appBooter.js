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

			var comps = appBootstrapper.getComponents();
		    if (comps)
			    registerComponents(comps);
			var routes = appBootstrapper.getRoutes()
		    if (routes)
		        router.map(routes);

		    return appBootstrapper.load ? bs.load() : true;
	    };

	return {
		boot: boot
	};
});