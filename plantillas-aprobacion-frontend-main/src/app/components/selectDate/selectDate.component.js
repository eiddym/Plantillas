(function() {
    'use strict';

    angular
    .module('app')
    .component('mdSelectDate', {
        templateUrl: 'app/components/selectDate/selectDate.html',
        controller: ['$scope', 'Datetime', SelectDateController],
        controllerAs: 'vm',
        bindings: {
            ngModel: '=',
            ngDisabled: '=',
            ngRequired: '=',
            ngLabel: '@',
            yearIni: '@',
            yearEnd: '@',
            year: '@',
            month: '@',
            day: '@'
        }
    });

    /** @ngInject */
    function SelectDateController($scope, Datetime) {
        var vm = this;

        activate();

        function activate() {
            initDays();
            initMonths();
            initYears();

            if (vm.ngModel && Datetime.isDate(new Date(vm.ngModel))) {
                var date = new Date(vm.ngModel);
                vm.day = date.getDate();
                vm.month = date.getMonth() + 1;
                vm.year = date.getFullYear();
            }
        }

        function initDays() {
            var days = [];
            for (var i = 1; i <= 31; i++) {
                days.push({
                    name: i,
                    value: i
                });
            }
            vm.days = days;
        }

        function initMonths() {
            var months = [];
            for (var i = 0; i < 12; i++) {
                months.push({
                    name: Datetime.months[i],
                    value: i + 1
                });
            }
            vm.months = months;
        }

        function initYears() {
            var year = parseInt(Datetime.now('YYYY'));
            var years = [];
            var yearIni = year - (vm.yearIni || 100);
            var yearEnd = year - (vm.yearEnd || 0);
            for (var i = yearEnd, l = yearIni; i >= l; i--) {
                years.push({
                    name: i,
                    value: i
                });
            }
            vm.years = years;
            // if (typeof vm.year == 'undefined' && typeof vm.ngModel == 'undefined') {
            //     vm.year = year - 30;
            // }
        }

        $scope.$watch('vm.day', function (newValue, oldValue) {
            oldValue = oldValue; 
            vm.ngModel = new Date(vm.year, vm.month-1, newValue);
        });
        $scope.$watch('vm.month', function (newValue, oldValue) {
            oldValue = oldValue; 
            vm.ngModel = new Date(vm.year, newValue-1, vm.day);
        });
        $scope.$watch('vm.year', function (newValue, oldValue) {
            oldValue = oldValue; 
            vm.ngModel = new Date(newValue, vm.month-1, vm.day);
        });
        $scope.$watch('vm.ngModel', function (newValue, oldValue) {
            if (newValue && newValue != oldValue && Datetime.isDate(new Date(newValue))) {
                var date = new Date(newValue);
                vm.day = date.getDate();
                vm.month = date.getMonth() + 1;
                vm.year = date.getFullYear();
            }
        });
    }

})();
