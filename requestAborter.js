define(function() {
    var processingRequests = {},
        getFullKey = function (group, key) {
            return group ? (group + ':' + key) : key;
        },
        abort = function (group, key) {
            var fullKey = getFullKey(group, key);
            var req = processingRequests[fullKey];
            if (req) {
                req.abort();
                delete processingRequests[fullKey];
            }
        },
        add = function (group, key, promise) {
            var fullKey = getFullKey(group, key);
            processingRequests[fullKey] = promise;
            promise.finally(function() {
                delete processingRequests[fullKey];
            });
        };

    return {
        add: add,
        abort: abort
    };
});