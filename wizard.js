define(function (require) {
	var
        ko = require('ko'),
        Q = require('q'),
        isTransitioning = ko.observable(false),
        events = require('durandal/events'),
        trigger = events.prototype.trigger,
        on = events.prototype.on,
        off = events.prototype.off,

        create = function () {
        	var
                steps = ko.observableArray([]),
                skipableSteps = ko.observableArray([]),
                activeStep = ko.observable(steps[0]),


                goToStep = function (number) {
                	var index = number - 1,
                        step = steps()[index];


                	if (!step) {
                		throw 'Step is not available';
                	}

                	if (step && canActivateStep(step)) {
                		activeStep(step);
                		return step;
                	} else {
                		return false;
                	}

                },

                getStep = function (number) {
                	return steps()[number - 1];
                },

                goToNextStep = function () {
                	var step = activeStep(),
                        index = steps().indexOf(step),
                        number = index + 1,
                        nextNumber = number + 1;

                	if (isLastStep()) {
                		this.finish();
                	} else {
                		while (false === goToStep(nextNumber)) {
                			nextNumber++;
                		}
                	}

                },

                goNext = function () {
                	var promise,
                        that = this;
                	try {
                		promise = Q(activeStep().submit()); //cast all to promises
                	} catch (e) {
                		console.log('Should stay on current page', e);
                		return;
                	}

                	return promise
                        .then(function () {
                        	that.goToNextStep();
                        }, function (reason) {
                        	console.log('Should stay on current page', reason);
                        });
                },

                finish = function () {
                	console.log('wizard complete');
                	this.trigger('complete');
                },

                isLastStep = ko.computed(function () {
                	return steps().indexOf(activeStep()) === steps().length - 1;
                }),

                canSkip = ko.observable(false),

                skipStep = function () {
                	var step = activeStep();
                	step.skipped = true;
                	this.goToNextStep();

                },

                canActivateStep = function (step) {
                	return step.canActivate ? step.canActivate() : true;
                },

                addStepMethods = function (step) {

                	step.showErrors = ko.observable(false);
                	step.hasErrors = ko.computed(function () {
                		return _.some(step.checkFields, function (field) {
                			return !field.isValid();
                		});
                	});
                	step.error = ko.observable(null);
                	step.showError = function (field) {
                		return step.showErrors() && !field.isValid();
                	};
                	step.checkForm = function () {
                		return step.checkFields.forEach(function (field) {
                			field.valueHasMutated();
                		});
                	};

                	step.compositionComplete = function () {
                		isTransitioning(false);
                	};

                	if (!step.activate) {
                		step.activate = function () {
                			reset(step);
                		};
                	}
                },

                reset = function (step) {
                	console.log('resetting viewmodel', step);
                	//resetting wizard step
                	step.showErrors(false);
                	step.error(null);
                	step.reset && step.reset();
                	step.checkFields && step.checkFields.forEach(function (field) {
                		field(null);
                		field.isModified(false);
                	});

                	delete step.skipped;
                };

        	activeStep.subscribe(function (step) {
        		isTransitioning(true);
        		canSkip(skipableSteps().indexOf(step) !== -1);
        	});

        	steps.subscribe(function (steps) {
        		activeStep(steps[0]);
        		steps.forEach(addStepMethods);
        	});

        	skipableSteps.subscribe(function (steps) {
        		console.log('set skipabled steps to', steps);
        	});

        	return {
        		activeStep: activeStep,
        		goNext: goNext,
        		canSkip: canSkip,
        		skipStep: skipStep,
        		isLastStep: isLastStep,
        		goToStep: goToStep,
        		goToNextStep: goToNextStep,
        		getStep: getStep,
        		steps: steps,
        		skipableSteps: skipableSteps,
        		finish: finish,
        		addStepMethods: addStepMethods,
        		on: on,
        		off: off,
        		trigger: trigger
        	};
        };

	return {
		create: create,
		isTransitioning: isTransitioning
	}
});