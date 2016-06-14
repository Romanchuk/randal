define(['ko', 'durandal/composition', 'durandal/viewEngine'], function (ko, composition, viewEngine) {
    var compositionDataKey = 'durandal-composition-data',
        cloneNodes = function (nodesArray) {
            var newNodesArray = [];
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(clonedNode);
            }
            return newNodesArray;
        },
		tabModule = {},
		tabGroups = {},
		HyerarchyLvl = function (tab) {
			var self = this;
		    this.tab = tab;
		    this.model = ko.observable(null);
			this.update = function () {
			    if (!this.tab || this.tab === self.model())
					return self;
			    this.tab.isNavigating(true);
			    self.model(this.tab);
				return self;
			};
		    this.update();
			this.compositionComplete = function (container, elem, context) {
				var hierarchyChain = self.model().group.hierarchyChain,
					nextLvlInd = hierarchyChain.indexOf(self) + 1;
				if (hierarchyChain.length - 1 > nextLvlInd)
					hierarchyChain[nextLvlInd].update(self.model().activeTab());
				else {
					self.model().isNavigating(false);
				}
			};
			this.attached = function() {
				
			};
		},
		TabGroup = function (rootTab) {
			var self = this;
			this.tab = rootTab;
			this.hierarchyChain = [];
			this.options = [{ title: 'title' }];
			this.setOptions = function(options) {
				self.options = options;
				return self;
			};
			this.subscribers = [];
			this.subscribeTo = function () { //groupName, lvl, fields
				var groupName = arguments[0],
					lvl = arguments[1],
					fields = Array.prototype.slice.call(arguments, 2);
				tabModule.use(groupName).subscribers.push({
					group: self,
					lvl: lvl,
					fields: fields
				});
				return self;
			};
			var getFieldsValue = function(tab, fields) {
				var val = '';
				for (var k = 0; k < fields.length; ++k)
					val += (tab.data[fields[k]] || '');
				return val;
			},
			getLvlTabs = function (lvl) {
				var lvlTabs = self.tab.root; //0 lvl
				for (var i = 1; i <= lvl; ++i) {
					var t = lvlTabs.activeTab();
					if (!t) return null;
					lvlTabs = t;
				}
				return lvlTabs;
			};
			this.notify = function (lvl, fields, value) {
				var lvlTabs = getLvlTabs(lvl);
				if (lvlTabs) {
					var tabToActivate = ko.utils.arrayFirst(lvlTabs.tabs, function (t) {
						return getFieldsValue(t, fields) === value;
					});
					if (tabToActivate) {
					    lvlTabs.navigate(tabToActivate);
					    tabToActivate.updateHeirarchy();
					}
				}
			};
			this.notifySubscribers = function (lvl) {
				var subscribersToNotify = ko.utils.arrayFilter(self.subscribers, function(s) {
					return s.lvl === lvl;
				});
				for (var i = 0; i < subscribersToNotify.length; ++i) {
					var subs = subscribersToNotify[i],
						lvlTabs = getLvlTabs(lvl);
					if (lvlTabs && lvlTabs.activeTab())
						subs.group.notify(lvl, subs.fields, getFieldsValue(lvlTabs.activeTab(), subs.fields));
				}
			};
		},
		Tab = function(group, data) {
			var self = this;
			this.group = group;
			this.title = '';
			this.parent = null;
			this.root = this;
			this.isNavigating = null;
			this.isActive = ko.observable(false);
			this.tabs = [];
			this.addTab = function (tab, title) {
				tab.title = title;
				self.tabs.push(tab);
				tab.parent = self;
				tab.root = self.root;
				tab.root.isNavigating = tab.root.isNavigating || ko.observable(false);
				tab.isNavigating = tab.root.isNavigating;
				return self;
			};
			this.activeTab = ko.observable(null);
			this.data = data;
			this.getDepthLvl = function() {
				var lvl = 0,
					curTab = self;
				while (curTab.root != curTab.parent) {
					lvl++;
					curTab = curTab.parent;
				}
				return lvl;
			};
		    var activateTab = function(tab) {
		        if (self.activeTab())
		            self.activeTab().isActive(false);

		        self.activeTab(tab);

		        if (self.activeTab())
		            self.activeTab().isActive(true);
		    };
			this.updateHeirarchy = function() {
			    //build chain
			    var tab = self.root.activeTab(),
					lvl = 0;
				while (tab) {
					if (!tab.group.hierarchyChain[lvl])
					    tab.group.hierarchyChain[lvl] = new HyerarchyLvl(tab);
					else {
					    tab.group.hierarchyChain[lvl].tab = tab;
					}
					tab = tab.activeTab();
					lvl++;
				}
			    //update chain
			    tab = self.root.activeTab();
				var chain = tab.group.hierarchyChain;
			    for (var i = 0; i < chain.length; i++) {
			        chain[i].update();
			        if (tab == null)
                        break;
				    tab = tab.activeTab();
				}
			};
			
			this.navigate = function (tab, event, initial) {
			    var ini = !!(event || initial),
                    tabToNav = tab || self.tabs[0];

				if (ini && self.activeTab() === tabToNav) //do not navigate
					return;
				
				if (tabToNav.isNavigating())
					return;
				
				activateTab(tabToNav);
				
				if (tabToNav.tabs.length > 0)
					tabToNav.navigate(tabToNav.tabs[0]);

				if (ini) {
				    this.updateHeirarchy();
					tabToNav.group.notifySubscribers(tabToNav.getDepthLvl());
				}
			};
			
			var buildNav = function(parent, items, lvl) {
				var nextLvl = lvl + 1;
				for (var i = 0; i < items.length; ++i) {
					var newData = items[i],
						tab = new Tab(parent.group || self.group, newData),
						opts = self.group.options[lvl] || {};
					parent.addTab(tab, newData[opts.title]);
					if (opts.items) {
						buildNav(tab, newData[opts.items], nextLvl);
					}
				}
			};

			this.buildNavigationModel = function (d) {
				self.activeTab(null);
				self.tabs = [];
				buildNav(self, d, 0);
				self.navigate(self.tabs[0], null, true);
				return self;
			};
		};
		tabModule.tabGroups = tabGroups;
		tabModule.use = function (groupName) {
			if (!tabGroups[groupName]) {
				var rootTab = new Tab(null);
				rootTab.group = tabGroups[groupName] = new TabGroup(rootTab);
			}
			return tabGroups[groupName];
		};
		tabModule.install = function () {
			ko.bindingHandlers.tabContent = {
				init: function () {
					return { controlsDescendantBindings: true };
				},
				update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
					var settings = ko.utils.unwrapObservable(valueAccessor()) || {},
						theTab = ko.utils.unwrapObservable(settings.tabs || viewModel.tabs) || bindingContext.$tabs,
						activeTab = theTab.activeTab.peek(),
						hierarchyLvl;
					
					if (activeTab)
						hierarchyLvl = theTab.group.hierarchyChain[activeTab.getDepthLvl()];
					else return;

					settings.attached = hierarchyLvl.attached;
					settings.compositionComplete = hierarchyLvl.compositionComplete;
					settings.model = hierarchyLvl.model().data;
					settings.activate = false;
					settings.preserveContext = true;

					if (settings.mode) {
						var data = ko.utils.domData.get(element, compositionDataKey);
						if (!data) {
							var childNodes = ko.virtualElements.childNodes(element);
							data = {};
							if (settings.mode === 'inline') {
								data.view = viewEngine.ensureSingleElement(childNodes);
							} else if (settings.mode === 'templated') {
								data.parts = cloneNodes(childNodes);
							}
							ko.virtualElements.emptyNode(element);
							ko.utils.domData.set(element, compositionDataKey, data);
						}
						if (settings.mode === 'inline') {
							settings.view = data.view.cloneNode(true);
						} else if (settings.mode === 'templated') {
							settings.parts = data.parts;
						}
						settings.preserveContext = true;
					}
					composition.compose(element, settings, bindingContext.createChildContext(
																	bindingContext.$rawData, 
																	null, // Optionally, pass a string here as an alias for the data item in descendant contexts
																	function(context) {
																		context.$tabs = activeTab;
																	}));
				}
				
			};
			ko.virtualElements.allowedBindings.tabContent = true;

			return tabModule;
		};

	return tabModule;
});
