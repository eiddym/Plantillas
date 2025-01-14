(function() {
    'use strict'

    angular
    .module('app')
    .factory('Datetime', ['Util', 'ArrayUtil', DatetimeFactory])
    .factory('ArrayUtil', ArrayUtilFactory);

    function ArrayUtilFactory() {
        var factory = {
            replace: replace,
            insert: insert,
            mover: mover,
            buscarObj: buscarObj
        };

        function replace (text, find, replace) {
            for (var i = 0, l = find.length, regex; i < l; i++) {
                regex = new RegExp(find[i], "g");
                text = text.replace(regex, replace[i]);
            }
            return text;
        }

        /**
            Funcion que mueve un item de un array al mismo array o a un segundo array
            @param {Array} arr Primer array del que se sacara el item
            @param {Integer} fromIndex Indice del item que se sacara del primer array
            @param {Integer} toIndex Indice del lugar en el que se pusheara en el segundo arraysi esta definido
            @param {Array} arr2 Segundo array en el que se pusheara si esta definido
        */
        function mover (arr, fromIndex, toIndex, arr2) {
            var item = arr[fromIndex];
            arr.splice(fromIndex, 1);
            if(angular.isDefined(arr2))
                arr2.splice(toIndex, 0, item);
            else
                arr.splice(toIndex, 0, item);
        }

        /**
            Funcion que inserta un item a un array en una posicion
            @param {Array} arr Array en el que se pusheara el item
            @param {Integer} toIndex Indice del lugar en el que se pusheara el item
            @param {Generico} item ELemento que se pusheara al array
        */
        function insert (arr, toIndex, item) {
            arr.splice(toIndex, 0, item);
        }

        /**
            Funcion que busca un objeto en un array
            @param {Array} arr Array que tiene objetos
            @param {string} attr Atributo de un objeto del array
            @param {string} val Valor con el que se comparara
            @param {Boolean} sw_obj True la funcion devuelve el objeto encontrado, false|undefined la funcion devuelve true si encuentra el objeto
        */
        function buscarObj(arr, attrib, val, sw_obj) {
            for (var i = 0; i < arr.length; i++)
                if(arr[i][attrib] == val) return (sw_obj)? arr[i] : true;
                
            return (sw_obj)? null : false;
        }

        return factory;
    }


    /** @ngInject */
    function DatetimeFactory(Util, ArrayUtil) {

        var formatDate = 'dd/MM/YYYY',
        months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        days = ["dom", "lun", "mar", "mié" , "jue", "vie" , "sáb"],
        dayslong = ["Domingo", "Lunes", "Martes", "Miércoles" , "Jueves", "Viernes" , "Sábado"];

        var factory = {
            isDate: isDate,
            isValid: isValid,
            isLessThan: isLessThan,
            isLessThanDays: isLessThanDays,
            isGreaterThan: isGreaterThan,
            isGreaterThanDays: isGreaterThanDays,
            addDays: addDays,
            subtractDays: subtractDays,
            diff: diff,
            milliseconds: milliseconds,
            convert: convert,
            setFormatDate: setFormatDate,
            now: now,
            dateLiteral: dateLiteral,
            time: time,
            times: times,
            timeLiteral: timeLiteral,
            datetimeLiteral: datetimeLiteral,
            format: format,
            getSeconds: getSeconds,
            standar: standar,
            replace: replace,
            last: last,
            secondsBetweenTwoDates: secondsBetweenTwoDates,
            minutesBetweenTwoDates: minutesBetweenTwoDates,
            hoursBetweenTwoDates: hoursBetweenTwoDates,
            daysBetweenTwoDates: daysBetweenTwoDates,
            betweenTwoDates: betweenTwoDates,
            isYesterday: isYesterday,
            parseDate: parseDate,
            parseDateDjango: parseDateDjango,
            dateMonth: dateMonth,
            parse : parse,
            formatDate: formatDate,
            months: months,
            days: days,
            getPrevDateMonth: getPrevDateMonth,
            date: date,
            dayslong: dayslong
        }

        return factory;

        function date(pDate, separator) {
            var date = pDate[0].split(separator || '-');
            return new Date(date[0],date[1]-1,date[2]);
        }

        function parse(date, separator) {
            return [date.getFullYear(), date.getMonth()+1, date.getDate()].join(separator || '-');
        }

        function dateMonth() {
            var date = new Date();
            return new Date(date.getFullYear(), date.getMonth(), 1);
        }

        function getPrevDateMonth(data) {
            data = data || 1;
            var date = new Date();
            var day = date.getDate();
            var month = date.getMonth()
            var year = date.getFullYear();

            if (day < data) {
                month--;
                if (month < 0) {
                    month = 11;
                    year--;
                }
            }
            return new Date(year, month, data);
        }

        function isDate (date) {
            if (Util.toType(date) == 'string') {
                date = convert(date);
            }
            return isValid(date);
        }

        function isValid (date) {
            if (Util.toType(date) != 'date')
                return false;
            return !isNaN(date.getTime());
        }

        function isLessThan (date) {
            return milliseconds(date) < (new Date()).getTime();
        }

        function isLessThanDays (date, data) {
            return milliseconds(date) > subtractDays(new Date(), data);
        }

        function isGreaterThan (date) {
            return milliseconds(date) > (new Date()).getTime();
        }

        function isGreaterThanDays (date, data) {
            return milliseconds(date) < addDays(new Date(), data);
        }

        function addDays (date, days) {
            return milliseconds(date) + (days || 0)*24*60*60*1000;
        }

        function subtractDays (date, days) {
            return milliseconds(date) - (days || 0)*24*60*60*1000;
        }

        function diff (date2, date1) {
            return milliseconds(date2) - milliseconds(date1);
        }

        function milliseconds (date) {
            if (Util.toType(date) == 'string') {
                date = convert(date);
            }
            return date.getTime();
        }

        function convert (date) {
            date = date.split('/');
            return formatDate == 'dd/MM/YYYY' ? new Date(date[2], date[1]-1, date[0]) :
            formatDate == 'MM/dd/YYYY' ? new Date(date[2], date[0]-1, date[1]) :
            new Date(date[0], date[1]-1, date[2]);
        }

        function setFormatDate (format) {
            formatDate = format;
        }

        function now (format) {
            return replace(new Date(), format || formatDate);
        }

        function dateLiteral (date) {
            return format(date, 'dd de MMM del YYYY');
        }

        function time (date) {
            return format(date, 'HH:mm');
        }

        function times (date) {
            return format(date, 'HH:mm:ss');
        }

        function timeLiteral(time, txt) {
            var text = '';
            if (typeof time == 'number') {
                if (time == 0) {
                    return '';
                }
                if (time < 60) {
                    text = time + 's';
                } else if (time < 3600) {
                    text = Math.floor(time / 60) + 'm ' + (time % 60 > 0 ? (time % 60 + 's') : '');
                } else {
                    text = Math.floor(time / 3600) + 'h ' + (time % 3600 > 0 ? (Math.floor(time / 60) + 'm ') : '') + (time % 60 > 0 ? (time % 60 + 's') : '');
                }
                return (txt || '') + text;
            } else {
                if (time.length == 0) {
                    return '';
                }
                time = time.split(':');
                var hours = time[0],
                    minutes = time[1];

                if (parseInt(hours) > 0) {
                    text += parseInt(hours) + 'h ';
                }
                if (parseInt(minutes) > 0) {
                    text += parseInt(minutes) + 'm ';
                }
                if (time.length == 3 && parseInt(time[2]) > 0) {
                    text += parseInt(time[2]) + 's' ;
                }

                return (txt || '') + text;
            }
        }

        function getSeconds(time) {
            time = time.split(':');
            var hours = time[0],
                minutes = time[1],
                total = 0;

            if (parseInt(hours) > 0) {
                total += parseInt(hours)*3600;
            }
            if (parseInt(minutes) > 0) {
                total += parseInt(minutes)*60;
            }
            if (time.length == 3 && parseInt(time[2]) > 0) {
                total += parseInt(time[2]);
            }

            return total;
        }

        function datetimeLiteral (date) {
            return format(date, 'dddd dd de MMM del YYYY a la(s) HH:mm');
        }

        function format (date, format) {
            var d = new Date(date);
            if (isDate(d)) {
                return replace(d, format || formatDate);
            }
            return date;
        }

        function standar (date, format) {
            var type = Util.toType(date);
            if (type == 'date') {
                return date;
            }
            if (type == 'string') {
                format = format || formatDate;
                var separator = date.indexOf('/') != -1 ? '/' : '-';
                date = date.split(separator);
                if (format == 'dd/MM/YYYY' || format == 'dd-MM-YYYY') {
                    date = date[1] + separator + date[0] + separator + date[2];
                }
                if (format == 'YYYY/dd/MM' || format == 'YYYY-dd-MM') {
                    date = date[0] + separator + date[1] + separator + date[0];
                }
            }
            return new Date(date);
        }

        function replace (date, format) {
            format = format || formatDate;
            date = standar(date, format);
            var monthLiteral = format.indexOf('MMM') != -1;
            return ArrayUtil.replace(format, [
                "dddd", "ddd", "dd", monthLiteral ? 'MMM' : 'MM', 'YYYY', 'HH', 'mm', 'ss'
            ], [
                dayslong[date.getDay()],
                days[date.getDay()],
                (date.getDate() < 10 ? '0' : '') + date.getDate(),
                monthLiteral ? months[date.getMonth()] : ((date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1)),
                date.getFullYear(),
                (date.getHours() < 10 ? '0' : '') + date.getHours(),
                (date.getMinutes() < 10 ? '0' : '') + date.getMinutes(),
                (date.getSeconds() < 10 ? '0' : '') + date.getSeconds()
            ]);
        }

        function last (date) {
            var now = new Date();
            var days = daysBetweenTwoDates(date, now);
            if (days > 31) {
                return dateLiteral(date);
            } else {
                if (days > 7) {
                    var weeks = parseInt(days / 7);
                    return 'Hace ' + weeks + ' semana' + (weeks > 1 ? 's' : '');
                } else {
                    if (days >= 1) {
                        return format(date, 'ddd a la(s) HH:mm');
                    } else {
                        var hours = hoursBetweenTwoDates(date, now);
                        if (isYesterday(date, hours)) {
                            return 'Ayer a la(s) ' + time(date);
                        } else {
                            if (hours >= 1) {
                                return 'Hace ' + hours + ' hora' + (hours > 1 ? 's' : '');
                            } else {
                                var minutes = minutesBetweenTwoDates(date, now);
                                if (minutes >= 1) {
                                    return 'Hace ' + minutes + ' minuto' + (minutes > 1 ? 's' : '');
                                } else {
                                    var seconds = secondsBetweenTwoDates(date, now);
                                    return 'Hace ' + seconds + ' segundo' + (seconds > 1 ? 's' : '');
                                }
                            }
                        }
                    }
                }
            }
        }

        function secondsBetweenTwoDates (date1, date2, absolute) {
            return betweenTwoDates(date1, date2, "s", absolute);
        }

        function minutesBetweenTwoDates (date1, date2, absolute) {
            return betweenTwoDates(date1, date2, "i", absolute);
        }

        function hoursBetweenTwoDates (date1, date2, absolute) {
            return betweenTwoDates(date1, date2, "h", absolute);
        }

        function daysBetweenTwoDates (date1, date2, absolute) {
            return betweenTwoDates(date1, date2, "d", absolute);
        }

        function betweenTwoDates (date1, date2, type, absolute) {
            var types = {s : 1000, i : 60*1000, h : 60*60*1000, d : 24*60*60*1000};
            var diff = parseInt((standar(date2).getTime() - standar(date1).getTime())/types[type]);

            if (typeof absolute !== 'undefined' && absolute !== false) {
                return Math.abs(diff);
            }
            return diff;
        }

        function isYesterday (date, hours) {
            if (isDate(date)) {
                date = date.split(' ');
                var time = date[1].split(':');
                return hours >= parseInt(time[0]);
            }
            return false;
        }

        function parseDate(date) {
            return [date.getDate(), date.getMonth() + 1, date.getFullYear()].join('/')
        }

        function parseDateDjango(date) {
            return [date.getFullYear(),date.getMonth()+1,date.getDate()].join('-');
        }

    }
})();
