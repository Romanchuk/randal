define(function (require) {
	var ko = require('knockout'),
        User = function() {
	        var self = this;
	        self.username = ko.observable('');
        	return self;
        };

	User.mapper = {
		fromDto: function (dto, item) {
			item = item || new User();
		    item.username(dto.userName);
			return item;
		}
	};

	return User;
});
