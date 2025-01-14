(function() {
    'use strict';

    angular
    .module('app')
    .filter('datetime', ['Datetime', function(Datetime) {

        return function(date, format) {

            if (format) {
                if (format == 'literal') {
                    return Datetime.dateLiteral(date);
                }
                if (format == 'year') {
                    return Datetime.now('YYYY');
                }
                if (format == 'timeLiteral') {
                    return Datetime.timeLiteral(date);
                }
                if (format == 'HH:mm') {
                    date = date.split(':');
                    return [date[0], date[1]].join(':')
                }
            }

            return date;
        }
    }]);
})();