define(function (require) {
	var system = require('durandal/system'),
		ko = require('ko'),
		viewLocator = require('durandal/viewLocator'),
		_ = require('underscore'),
		binder = require('durandal/binder'),
		router = require('randal/router'),
		config = require('randal/config'),
		appBooter = require('randal/appBooter'),
		auth = require('randal/auth'),
		applySettings = function () {
			viewLocator.convertModuleIdToViewId = function (moduleId) {
				//account/account => account/views/account
				//auth/signin/signin => auth/signin/views/signin

				var parts = moduleId.match(/(\S+)\/([^/]+)$/),
					section = parts[1],//e.g. `account` or `auth/signin`
					module = parts[2];

				return section + '/views/' + module;
			};

			//setup router
			router.updateTitle = function () {
				router.updateDocumentTitle(undefined, router.activeInstruction());
			};

			var originalCreateChildRouter = router.createChildRouter,
				createChildRouter = function () {
					var childRouter = originalCreateChildRouter.call(this);

					childRouter.updateDocumentTitle = router.updateDocumentTitle;
					childRouter.updateTitle = router.updateTitle;
					childRouter.createChildRouter = createChildRouter;

					return childRouter;
				};

			router.createChildRouter = createChildRouter;

		},
		onNavigationCompleteBreadcrumbHandler = function (instance, instruction, targetRouter) {
			var crumbs = [],
				routes = targetRouter.routes,
				activeCrumb = routes.filter(function (route) {
					return route.breadcrumbOrder > -1 && route.isActive();
				})[0];

			if (activeCrumb) {
				_.each(routes, function (route) {
					if (!_.any(crumbs, function (crumb) { return crumb.moduleId === route.moduleId }) &&
																((route.showInBreadcrumb !== undefined && route.showInBreadcrumb !== null && route.showInBreadcrumb !== false) || route.showInBreadcrumb === undefined) &&
																route.breadcrumbOrder <= activeCrumb.breadcrumbOrder &&
																activeCrumb.route.indexOf(route.route) !== -1) {
						crumbs.push(route);
					}
				});
			}
			targetRouter.breadcrumbs(_.sortBy(crumbs, function (crumb) { return crumb.breadcrumbOrder }));
		},
		run = function (options) {
			system.debug(config.get('debug'));
			binder.throwOnErrors = true;

			auth.setup(options.updateUserCallback, options.userModel);

			if (options.tabs)
				require('randal/tabs').install();

			if (options.breadcrumbs) {
				router.breadcrumbs = ko.observable([]);
				router.on('router:navigation:complete', onNavigationCompleteBreadcrumbHandler);
			}
			applySettings();
			router.install();
			return appBooter.boot(router, options.bootstrapper);
		};

	return {
		run: run
	};
});