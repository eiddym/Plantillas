(function() {
    'use strict';

    /**
    * @todo Complete the test
    * This example is not perfect.
    * Test should check if MomentJS have been called
    */
    describe('directive navbar', function() {
    
        var vm;
        var el;
        var timeInMs;

        beforeEach(module('app'));
        beforeEach(inject(function($compile, $rootScope) {
            timeInMs = new Date();
            timeInMs = timeInMs.setHours(timeInMs.getHours() - 24);

            el = angular.element('<acme-navbar creation-date="' + timeInMs + '"></acme-navbar>');

            $compile(el)($rootScope.$new());
            $rootScope.$digest();
            vm = el.isolateScope().vm;
        }));

        it('should be compiled', function() {
            expect(el.html()).not.toEqual(null);
        });

        it('should have isolate scope object with instanciate members', function() {
            expect(vm).toEqual(jasmine.any(Object));

            expect(vm.creationDate).toEqual(jasmine.any(Number));
            expect(vm.creationDate).toEqual(timeInMs);

            expect(vm.relativeDate).toEqual(jasmine.any(String));
            expect(vm.relativeDate).toEqual('a day ago');
        });
    });
})();
