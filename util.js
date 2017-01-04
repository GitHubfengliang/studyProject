/**
 * Created by zhanghh on 2016/4/19.
 */
define(
    ['jquery'],
    function($) {
        //获取IE版本号(非IE返回>=12的值)
        function getIEVer() {
            var v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');
            while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);
            v = v > 4 ? v : 12;

            if (v >= 12 && 'ActiveXObject' in window) {
                v = document.documentMode;
            }

            return v;
        }

        //获取HTTP GET请求参数
        function getUrlParam(key){
            var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
            var value = window.location.search.substr(1).match(reg);
            if (value !== null){
                return decodeURIComponent(value[2]);
            }
            return null;
        }

        /**
         * 重写toFixed方法
         * @param decimalDigits
         */
        Number.prototype.toFixedNoMinus = function(decimalDigits) {
            var numStr = this.toFixed(decimalDigits);
            if (parseFloat(numStr) == 0) {
                return numStr.replace('-', '');
            }
            return numStr;
        };

        /**
         * 添加格式化方法
         * @param format
         * @returns {*}
         */
        Date.prototype.format = function(format) {
            var date = {
                "M+": this.getMonth() + 1,
                "d+": this.getDate(),
                "h+": this.getHours(),
                "m+": this.getMinutes(),
                "s+": this.getSeconds(),
                "q+": Math.floor((this.getMonth() + 3) / 3),
                "S+": this.getMilliseconds()
            };
            if (/(y+)/i.test(format)) {
                format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
            }
            for (var k in date) {
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format.replace(RegExp.$1, RegExp.$1.length == 1
                        ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
                }
            }
            return format;
        };

        //读取cookie
        function getCookie(name) {
            var m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)(;|$)'));
            return !m ? '' : unescape(m[2]);
        }

        //获取级别域名(domain)
        function getLevelDomain(level) {
            var arr = document.domain.split('.');
            while (arr.length > level) {
                arr.shift();
            }
            return arr.join('.');
        }

        //设置session(会话cookie)
        function setSession(name, value, domain, path) {
            document.cookie = name + '=' + value + '; ' + 'expires=; path=' + (path ? path : '/') + '; ' + (domain ? ('domain=' + domain + ';') : '');
        }

        //设置cookie
        function setCookie(name, value, hour, domain, path) {
            var expire = new Date();
            expire.setTime(expire.getTime() + (hour ? hour * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000));
            document.cookie = name + '=' + value + '; ' + 'expires=' + expire.toUTCString() + '; path=' + (path ? path : '/') + '; ' + (domain ? ('domain=' + domain + ';') : '');
        }

        //删除cookie
        function delCookie(name, domain, path) {
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + (path ? path : '/') + '; ' + (domain ? ('domain=' + domain + ';') : '');
        }

        //清空cookie
        function clrCookie(domain, path) {
            var rs = document.cookie.match(new RegExp('([^ ;][^;]*)(?=(=[^;]*)(;|$))', 'gi'));
            for (var i in rs) {
                document.cookie = rs[i] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + (path ? path : '/') + '; ' + (domain ? ('domain=' + domain + ';') : '');
            }
        }

        //删除二级域名(SLD)cookie
        function delSldCookie(name){
            var arr = document.domain.split('.');
            if (arr.length == 2) {
                clrCookie();
            }
            while (arr.length > 2) {
                arr.shift();
                if(arr.length == 2){
                    delCookie(name, arr.join('.'));
                    delCookie(name, '.' + arr.join('.'));
                }
            }
        }

        //删除父级域名(二级或以下PLD)cookie
        function delPldCookie(name){
            var arr = document.domain.split('.');
            arr.shift();
            if(arr.length >= 2){
                delCookie(name, arr.join('.'));
                delCookie(name, '.' + arr.join('.'));
            }
        }

        //清空二级以下域名(LSLD)cookie
        function clrLsldCookie() {
            var arr = document.domain.split('.');
            if (arr.length > 2) {
                clrCookie();
            }
            while (arr.length > 2) {
                clrCookie(arr.join('.'));
                clrCookie('.' + arr.join('.'));
                arr.shift();
            }
        }

        //清空当前域名(二级以下LLD)cookie
        function clrLldCookie() {
            var arr = document.domain.split('.');
            if (arr.length > 2) {
                clrCookie();
            }
        }

        function getClientType(){
            var domainTop = window;
            while(domainTop.parent !== domainTop){
                try{
                    if(domainTop.parent.location.host === location.host && domainTop.parent.location.protocol === location.protocol){
                        domainTop = domainTop.parent;
                    }else{
                        break;
                    }
                }catch(err){
                    break;
                }
            }

            var cliType = 0;                //通用Web浏览器
            if(domainTop !== window.top){
                cliType = 1;                //Go-Goal终端2.0之nwjs(node-webkit)版
            }else if(getUrlParam('qtFrame') === '1' || navigator.userAgent.search(/Go-Goal/i) >= 0){
                cliType = 2;                //Go-Goal终端2.0之QtWebKit版
            }

            return cliType;
        }

        function getToken(){
            var token;
            if(getClientType() == 0){
                token = getCookie('token');
            }else{
                token = getUrlParam('token');
                delCookie('web');
            }
            if(typeof(token) === 'string'){
                token = $.trim(token);
            }else{
                token = '';
            }
            return token;
        }

        //获取绝对路径URL链接
        function absUrl(url){
            if(url != null){
                var div = document.createElement('div');
                div.innerHTML = '<a href="' + document.createElement('a').appendChild(document.createTextNode(String(url))).parentNode.innerHTML + '"></a>';
                url = div.firstChild.href;

                if(window.self !== window.top){
                    if(url.indexOf('?') >= 0){
                        url = url.replace(/(\?[^?#]*)(#|$)/, '$1&token=' + getToken() + '$2');
                    }else{
                        url += '?token=' + getToken();
                    }
                }
            }
            return url;
        }

        //测试是否有效变量
        function isValidVariable(variable){
            if(typeof(variable) === 'undefined'){       //if(variable === undefined){
                return false;
            }
            if(variable === null){
                return false;
            }
            if(variable !== variable){      //NaN
                return false;
            }
            if(variable === Infinity){      //无穷大
                return false;
            }
            return true;
        }

        //测试是否空值
        function isBlankVariable(variable){
            //无效变量及空字符串
            if(!isValidVariable(variable) || variable === ''){
                return true;
            }

            //类型[]空
            if(Object.prototype.toString.call(variable) === '[object Array]'){
                for(var i in variable){
                    Number(i);
                    return false;
                }
                return true;
            }

            //类型{}空(参考：《对jQuery.isPlainObject()的理解》[http://www.cnblogs.com/phpmix/articles/1733599.html])
            if($.isPlainObject(variable)){
                for(var i in variable){
                    Number(i);
                    return false;
                }
                return true;
            }

            return false;
        }

        //递归测试属性是否有效存在且符合预期
        function hasExpectProp(inObject,propArray,expect){
            if(!$.isArray(propArray) || propArray.length < 1){
                return false;
            }
            try{
                var obj = inObject;
                for(var i in propArray){
                    var prop = String(propArray[i]);
                    if(typeof(prop) === 'string' && (prop = $.trim(prop)) !== ''){
                        obj = obj[prop];
                        if(obj == null){
                            return false;
                        }
                    }else{
                        return false;
                    }
                }
                if(typeof(expect) === 'function'){
                    return expect(obj);
                }
            }catch(err){
                return false;
            }
            return true;
        }

        //测试是否为HTMLElement对象
        function isHTMLElement(variable) {
            if (window.HTMLElement != null) {
                return variable instanceof window.HTMLElement;
            } else {
                return variable != null && typeof(variable.tagName) === 'string' && typeof(variable.outerHTML) === 'string' && variable.nodeType === 1 && variable.nodeName === variable.tagName && variable.ownerDocument === document;
            }
        }

        //获取浏览器客户区(可视区域)滚动条滚动位置
        function getFixedScroll() {
            var top = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var left = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            return {top: top, left: left};
        }

        //获取元素相对于浏览器可视区域(客户区)左上角的偏移位置，不含元素本身margin值（但含border值）
        function getFixedOffset(elem) {
            var $elem = $(elem);
            if ($elem.length === 1 && isHTMLElement($elem[0])) {
                var elemOffset = $elem.offset();        //offset()的计算不含元素本身margin值（但含border值），position()的计算包含元素本身margin值。
                var bodyOffset = $(document.body).offset();
                var scroll = getFixedScroll();
                return {
                    top: elemOffset.top - bodyOffset.top - scroll.top,
                    left: elemOffset.left - bodyOffset.left - scroll.left
                };
            } else {
                return {top: 0, left: 0};
            }
        }

        //获取N年前的同一天
        function getSameDateNYearsAgo(n, date, timeZone) {
            if ($.isNumeric(n)) {
                n = Number(n).toFixed(0);
            } else {
                n = 1;
            }
            date = new Date(date);
            if (isNaN(date)) {
                date = new Date();
            }
            var offset = date.getTimezoneOffset() * 60 * 1000;
            if ($.isNumeric(timeZone)) {
                offset = (-Number(timeZone) % 12) * 60 * 60 * 1000;
            }
            date.setTime(date.getTime() - offset);
            var year = date.getUTCFullYear() - n;
            var month = date.getUTCMonth();
            var mday = date.getUTCDate();
            var hours = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            var seconds = date.getUTCSeconds();
            var ms = date.getUTCMilliseconds();
            if (month === 1) { //2月份
                var d = new Date(Date.UTC(year, month + 1, 1, hours, minutes, seconds, ms));
                d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
                var mdayEnd = d.getUTCDate();
                if (mday > mdayEnd) {
                    mday = mdayEnd;
                }
            }
            return new Date(Date.UTC(year, month, mday, hours, minutes, seconds, ms) + offset);
        }

        //获取N月前的同一天
        function getSameDateNMonthsAgo(n, date, timeZone) {
            if ($.isNumeric(n)) {
                n = Math.floor(Number(n));
            } else {
                n = 1;
            }
            date = new Date(date);
            if (isNaN(date)) {
                date = new Date();
            }
            var offset = date.getTimezoneOffset() * 60 * 1000;
            if ($.isNumeric(timeZone)) {
                offset = (-Number(timeZone) % 12) * 60 * 60 * 1000;
            }
            date.setTime(date.getTime() - offset);
            var year = date.getUTCFullYear() - ((n - (n % 12)) / 12);
            var month = date.getUTCMonth() - (n % 12);
            var mday = date.getUTCDate();
            var hours = date.getUTCHours();
            var minutes = date.getUTCMinutes();
            var seconds = date.getUTCSeconds();
            var ms = date.getUTCMilliseconds();
            if (month === 1) { //2月份
                var d = new Date(Date.UTC(year, month + 1, 1, hours, minutes, seconds, ms));
                d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
                var mdayEnd = d.getUTCDate();
                if (mday > mdayEnd) {
                    mday = mdayEnd;
                }
            }
            return new Date(Date.UTC(year, month, mday, hours, minutes, seconds, ms) + offset);
        }

        //整数补零
        function prefixInteger(integer, bits) {
            if ($.isNumeric(integer)) {
                integer = Math.floor(Number(integer));
            } else {
                integer = 0;
            }
            if ($.isNumeric(bits) && bits > 0) {
                bits = Math.ceil(Number(bits));
            } else {
                bits = 2;
            }
            var sign = '';
            if (integer < 0) {
                sign = '-';
                integer = -integer;
            }
            if (integer >= Math.pow(10, bits - 1)) {
                return sign + integer;
            } else {
                return sign + (integer / Math.pow(10, bits)).toFixed(bits).slice(2);
            }
        }

        //转换时间戳为本时区时间字符串
        function getLocalTimeString(time) {
            var date = null;
            if (time == null) {
                date = new Date();
            } else if (time instanceof Date) {
                date = new Date(time);
            } else if (RegExp('^[-+]?[0-9]+$').test(String(time))) {
                date = new Date(Number(time));
            }
            if (date != null) {
                return date.getFullYear() + '-' + prefixInteger((date.getMonth() + 1), 2) + '-' + prefixInteger(date.getDate(), 2) + ' ' + prefixInteger(date.getHours(), 2) + ':' + prefixInteger(date.getMinutes(), 2) + ':' + prefixInteger(date.getSeconds(), 2) + '.' + prefixInteger(date.getMilliseconds(), 3);
            }

            return null;
        }

        //转换时间戳为UTC时间字符串
        function getUTCTimeString(time) {
            var date = null;
            if (time == null) {
                date = new Date();
            } else if (time instanceof Date) {
                date = new Date(time);
            } else if (RegExp('^[-+]?[0-9]+$').test(String(time))) {
                date = new Date(Number(time));
            }
            if (date != null) {
                return date.getUTCFullYear() + '-' + prefixInteger((date.getUTCMonth() + 1), 2) + '-' + prefixInteger(date.getUTCDate(), 2) + ' ' + prefixInteger(date.getUTCHours(), 2) + ':' + prefixInteger(date.getUTCMinutes(), 2) + ':' + prefixInteger(date.getUTCSeconds(), 2) + '.' + prefixInteger(date.getUTCMilliseconds(), 3);
            }

            return null;
        }

        //转换时间戳为PRC时间字符串
        function getPRCTimeString(time) {
            var date = null;
            if (time == null) {
                date = new Date();
            } else if (time instanceof Date) {
                date = new Date(time);
            } else if (RegExp('^[-+]?[0-9]+$').test(String(time))) {
                date = new Date(Number(time));
            }
            date.setTime(date.getTime() + 8 * 60 * 60 * 1000);
            if (date != null) {
                return date.getUTCFullYear() + '-' + prefixInteger((date.getUTCMonth() + 1), 2) + '-' + prefixInteger(date.getUTCDate(), 2) + ' ' + prefixInteger(date.getUTCHours(), 2) + ':' + prefixInteger(date.getUTCMinutes(), 2) + ':' + prefixInteger(date.getUTCSeconds(), 2) + '.' + prefixInteger(date.getUTCMilliseconds(), 3);
            }

            return null;
        }

        //转换PRC日期字符串为时间戳
        function getDateFromPRCStr(prcStr) {
            var date = null;
            if (typeof(prcStr) === 'string' && RegExp('^[0-9]+[-][0-9]+[-][0-9]+$').test(prcStr)) {
                var arr = prcStr.split('-');
                var year = parseInt(arr[0], 10);
                var month = parseInt(arr[1], 10);
                var mDate = parseInt(arr[2], 10);
                if (($.inArray(month, [1, 3, 5, 7, 8, 10, 12]) >= 0 && 1 <= mDate && mDate <= 31) || ($.inArray(month, [4, 6, 9, 11]) >= 0 && 1 <= mDate && mDate <= 30) || (month == 2 && 1 <= mDate && mDate <= (isLeapYear(year) ? 29 : 28))) {
                    date = new Date(Date.UTC(year, month - 1, mDate) - 8 * 60 * 60 * 1000);
                }
            }
            return date;
        }

        //判断是否为闰年
        function isLeapYear(year) {
            if (!$.isNumeric(year)) {
                return false;
            }
            return (year % 400 == 0) || ((year % 4 == 0) && (year % 100 != 0));
        }

        //获取输入框光标位置(参数ctrl为input或者textarea对象)
        function getCaretPosition(ctrl) {
            var caretPos = {start: 0, end: 0};
            if (ctrl.selectionStart != null && ctrl.selectionEnd != null) {
                caretPos = {
                    start: ctrl.selectionStart,
                    end: ctrl.selectionEnd
                };
            } else if (document.selection) {
                ctrl.focus();
                var sRange = document.selection.createRange();
                var len = sRange.text.length;
                sRange.moveStart('character', -ctrl.value.length);
                caretPos = {
                    start: sRange.text.length,
                    end: sRange.text.length + len
                };
            }
            return (caretPos);
        }

        //设置输入框光标位置(参数ctrl为input或者textarea对象)
        function setCaretPosition(ctrl, start, end) {
            if (end == null) {
                end = start;
            }
            if (ctrl.setSelectionRange) {
                ctrl.focus();
                ctrl.setSelectionRange(start, end);
            } else if (ctrl.createTextRange) {
                var tRange = ctrl.createTextRange();
                tRange.collapse(true);
                tRange.moveStart('character', start);
                tRange.moveEnd('character', end - start);
                tRange.select();
            }
        }

        //校验并规范日期字符串
        function normalizeDateString(str, ref) {
            ref = (ref || '').slice(0, 10);
            ref = ref + getPRCTimeString().slice(ref.length, 10);
            str = (str || '').slice(0, 10);
            str = str + ref.slice(str.length, 10);
            for (var i = 0; i < str.length; ++i) {
                var ch = str[i];
                if (i == 4 || i == 7) {
                    ch = '-';
                } else {
                    if (!/[0-9]/.test(ch)) {
                        ch = ref[i] || '0';
                    }
                    if (i == 0) {
                        ch = Math.max(1, ch);
                    } else if (i == 5) {
                        ch = Math.min(1, ch);
                    } else if (i == 6) {
                        if (str[5] == 0) {
                            ch = Math.max(1, ch);
                        } else {
                            ch = Math.min(2, ch);
                        }
                        if (parseInt(str.slice(5, 7), 10) == 2 && parseInt(str.slice(8, 10), 10) >= 30) {
                            str = str.slice(0, 8) + '29';
                        }
                    } else if (i == 8) {
                        if (parseInt(str.slice(5, 7), 10) == 2) {
                            ch = Math.min(2, ch);
                        } else {
                            ch = Math.min(3, ch);
                        }
                    } else if (i == 9) {
                        if (str[8] == 0) {
                            ch = Math.max(1, ch);
                        } else if (str[8] == 2) {
                            if (parseInt(str.slice(5, 7), 10) == 2 && !isLeapYear(str.slice(0, 4))) {
                                ch = Math.min(8, ch);
                            }
                        } else if (str[8] == 3) {
                            if ($.inArray(parseInt(str.slice(5, 7), 10), [1, 3, 5, 7, 8, 10, 12]) >= 0) {
                                ch = Math.min(1, ch);
                            } else {
                                ch = Math.min(0, ch);
                            }
                        }
                    }
                }
                str = str.slice(0, i) + ch + str.slice(i + 1);
            }
            return str;
        }

        // notice弹框
        var alertOptions = (function (){

            var $backAlert = $('<div class="backgroundAlert"></div>');

            var $alertNotice = $('' +
                '<div class="alertStr">' +
                '<div><p class="content"></p></div>' +
                '</div>'
            );


            var $alertAlert = $(
                '<div class="alertMessage"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title">温馨提示</p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleDragMove($alertAlert.find('.alertTitle'), $alertAlert);


            var $alertConfirm = $(
                '<div class="alertDiv"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title"></p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定</span></div> ' +
                '<div class="addCancel"><span>取消</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleDragMove($alertConfirm.find('.alertTitle'), $alertConfirm);



            var $alertConfirmInput = $(
                '<div class="alertInputDiv"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title"></p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<input type="text" placeholder=""/>' +
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定</span></div> ' +
                '<div class="addCancel"><span>取消</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleInputEvent($alertConfirmInput.find('.alertBody').children('input'),'name');
            handleDragMove($alertConfirmInput.find('.alertTitle'), $alertConfirmInput);

            var $alertConfirmExport = $(
                '<div class="alertInputDiv"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title"></p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<span style="margin-left: 46px"><span>请选择下载页数</span>' +
                '<select class="page" style="width: 40px;height:20px;margin-right: 8px;margin-left: 8px">' +
                '</select>' +
                '<span style="color: #999999;">以当前页为起点</span></span>' +
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定下载</span></div> ' +
                '<div class="addCancel"><span>取消</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleDragMove($alertConfirmExport.find('.alertTitle'), $alertConfirmExport);



            var $alertConfirmRadio = $(
                '<div class="alertRadioDiv"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title"></p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<div class="radioDiv">' +
                '</div>'+
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定</span></div> ' +
                '<div class="addCancel"><span>取消</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleDragMove($alertConfirmRadio.find('.alertTitle'), $alertConfirmRadio);

            // 导出pdf
            var $alertConfirmSelect = $(
                '<div class="alertSelectDiv"> ' +
                '<div class="alertTitle clearfix"> ' +
                '<p class="title"></p> ' +
                '<p><span><span>✕</span></span></p> ' +
                '</div> ' +
                '<div class="alertBody"> ' +
                '<div class="selectDiv">' +
                '<p class="describe"></p>' +
                '<select></select>' +
                '</div>'+
                '<p class="content"></p> ' +
                '</div> ' +
                '<div class="alertFoot clearfix"> ' +
                '<div class="addFinish"><span>确定导出</span></div> ' +
                '<div class="addCancel"><span>取消</span></div> ' +
                '</div> ' +
                '</div>'
            );
            handleDragMove($alertConfirmSelect.find('.alertTitle'), $alertConfirmSelect);



            var isLoadBackAlert = false;
            var isLoadNotice = false;
            var isLoadAlert = false;
            var isLoadConfirm = false;
            var isLoadConfirmInput = false;
            var isLoadConfirmExport = false;
            var isLoadConfirmRadio = false;
            var isLoadConfirmSelect = false;


            // notice提示
            function notice(content,time){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadNotice){
                    $('body').append($alertNotice);
                    isLoadNotice = true;
                }

                $backAlert.css('display','block');
                $alertNotice.css('display','block');

                $alertNotice.find('p.content').text(content);
                $alertNotice.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                if(isBlankVariable(time)){
                    time = 1500;
                }

                setTimeout(function(){
                    close();
                }, time);

                function close(){
                    $backAlert.css('display','none');
                    $alertNotice.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertNotice.css('z-index',parseInt(maxIndex,10)+2);
            }

            // alert弹框
            function alert(content,yesFunction,yesFunctionData){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadAlert){
                    $('body').append($alertAlert);
                    isLoadAlert = true;
                }

                $backAlert.css('display','block');
                $alertAlert.css('display','block');

                if(typeof content === 'string'){
                    $alertAlert.find('p.content').html(content);
                } else if(typeof content === 'object'){
                    $alertAlert.find('p.content').append(content);
                }

                $alertAlert.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                $alertAlert.find('.addFinish').off('click').on('click', function(){
                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction();
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertAlert.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertAlert.css('z-index',parseInt(maxIndex,10)+2);
            }

            // confirm弹框
            // title,content,yesFunction,noFunction,yesFunctionData,noFunctionData
            /***************
             * 参数示例
             * {
            title:'标题',
            content:'展示的内容',
            yesFunction:function(data){     // 确定时回调函数
                util.alert(data);
            },
            noFunction:function(data){      // 取消时回调函数
                util.alert(data);
            },
            yesFunctionData:['yes'], // 确定时回调函数的参数数组
            noFunctionData:['no']    // 取消时回调函数的参数数组
            }
             */
            function confirm(data){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadConfirm){
                    $('body').append($alertConfirm);
                    isLoadConfirm = true;
                }

                $backAlert.css('display','block');
                $alertConfirm.css('display','block');

                var title = !isBlankVariable(data.title)?data.title:'';
                var content = !isBlankVariable(data.content)?data.content:'';

                $alertConfirm.find('p.title').text(title);
                $alertConfirm.find('p.content').html(content);


                var yesFunction = data.yesFunction;
                var noFunction = data.noFunction;
                var yesFunctionData = data.yesFunctionData;
                var noFunctionData = data.noFunctionData;

                if(!isBlankVariable(data.yesText)){
                    $alertConfirm.find('.addFinish').find('span').text(data.yesText);
                }
                if(!isBlankVariable(data.noText)){
                    $alertConfirm.find('.addCancel').find('span').text(data.noText);
                }

                $alertConfirm.find('.addFinish').off('click').on('click', function(){
                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction();
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();
                });

                $alertConfirm.find('.addCancel').off('click').on('click', function(){
                    if(isBlankVariable(noFunctionData) || noFunctionData.length == 0){
                        if(!isBlankVariable(noFunction)){
                            noFunction();
                        }
                    } else {
                        if(!isBlankVariable(noFunction)){
                            noFunction.apply(document, noFunctionData);
                        }
                    }
                    close();
                });

                $alertConfirm.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertConfirm.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertConfirm.css('z-index',parseInt(maxIndex,10)+2);

            }



            // confirmInput弹框
            // title,content,placeholder,yesFunction,noFunction,yesFunctionData,noFunctionData
            /***************
             * 参数示例
             * {
            title:'标题',
            content:'展示的内容',
            placeholder:'input内容',
            yesFunction:function(inputVal, data){     // 确定时回调函数
                util.alert(data);
            },
            noFunction:function(inputVal, data){      // 取消时回调函数
                util.alert(data);
            },
            yesFunctionData:['yes'], // 确定时回调函数的参数数组
            noFunctionData:['no']    // 取消时回调函数的参数数组
            }
             */
            function confirmInput(data){


                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadConfirmInput){
                    $('body').append($alertConfirmInput);
                    isLoadConfirmInput = true;
                }



                $backAlert.css('display','block');
                $alertConfirmInput.css('display','block');


                var title = !isBlankVariable(data.title)?data.title:'';
                var content = !isBlankVariable(data.content)?data.content:'';
                var placeholder = !isBlankVariable(data.placeholder)?data.placeholder:'';
                if(!isBlankVariable(data.limit)){
                    handleInputEvent($alertConfirmInput.find('input'),'name',data.limit);
                }

                $alertConfirmInput.find('p.title').text(title);
                $alertConfirmInput.find('p.content').html(content);
                $alertConfirmInput.find('input').attr('placeholder',placeholder);
                $alertConfirmInput.find('.alertBody').children('input').val('');

                addPlaceholder($alertConfirmInput.find('input'));


                var yesFunction = data.yesFunction;
                var noFunction = data.noFunction;
                var yesFunctionData = data.yesFunctionData;
                var noFunctionData = data.noFunctionData;

                $alertConfirmInput.find('.addFinish').off('click').on('click', function(){

                    var inputVal = $alertConfirmInput.find('.alertBody').children('input').val();

                    if(inputVal == ''){
                        notice('请输入名称');
                        return;
                    }
                    if(inputVal.length > 16){
                        notice('名称不能超过16个字符');
                        return;
                    }


                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunctionData.unshift(inputVal);
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();

                });

                $alertConfirmInput.find('.addCancel').off('click').on('click', function(){

                    var inputVal = $alertConfirmInput.find('.alertBody').children('input').val();

                    if(isBlankVariable(noFunctionData) || noFunctionData.length == 0){
                        if(!isBlankVariable(noFunction)){
                            noFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(noFunction)){
                            noFunctionData.unshift(inputVal);
                            noFunction.apply(document, noFunctionData);
                        }
                    }
                    close();
                });
                $alertConfirmInput.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertConfirmInput.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertConfirmInput.css('z-index',parseInt(maxIndex,10)+2);


            }


            //导出Excel
            function confirmExport(data){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadConfirmExport){
                    $('body').append($alertConfirmExport);
                    isLoadConfirmExport = true;
                }

                $backAlert.css('display','block');
                $alertConfirmExport.css('display','block');


                var title = !isBlankVariable(data.title)?data.title:'';
                var content = !isBlankVariable(data.content)?data.content:'';
                var pages = !isBlankVariable(data.pages)?data.pages:1;

                $alertConfirmExport.find('p.title').text(title);
                $alertConfirmExport.find('p.content').text(content);
                var $jumpPage = $alertConfirmExport.find('select');

                $jumpPage.empty();
                for(var i=1;i<=pages;i++){
                    var $item =$('<option value="'+i+'">'+i+'</option>');
                    $jumpPage.append($item);
                }

                var yesFunction = data.yesFunction;
                var noFunction = data.noFunction;
                var yesFunctionData = data.yesFunctionData;
                var noFunctionData = data.noFunctionData;




                $alertConfirmExport.find('.addFinish').off('click').on('click', function(){

                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction($jumpPage.val());
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunctionData.unshift();
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();

                });

                $alertConfirmExport.find('.addCancel').off('click').on('click', function(){


                    if(isBlankVariable(noFunctionData) || noFunctionData.length == 0){
                        if(!isBlankVariable(noFunction)){
                            noFunction();
                        }
                    } else {
                        if(!isBlankVariable(noFunction)){
                            noFunctionData.unshift();
                            noFunction.apply(document, noFunctionData);
                        }
                    }
                    close();
                });
                $alertConfirmExport.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertConfirmExport.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertConfirmExport.css('z-index',parseInt(maxIndex,10)+2);

            }


            // 二选一
            function confirmRadio(data){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadConfirmRadio){
                    $('body').append($alertConfirmRadio);
                    isLoadConfirmRadio = true;
                }

                $backAlert.css('display','block');
                $alertConfirmRadio.css('display','block');

                var title = !isBlankVariable(data.title)?data.title:'';
                var content = !isBlankVariable(data.content)?data.content:'';

                if(!isBlankVariable(data.options)){
                    $alertConfirmRadio.find('.radioDiv').empty();
                    for(var i in data.options){
                        var option = data.options[i];
                        var $option = $(''+
                            '<div class="optionDiv">' +
                            '<input type="radio" name="setType" value="'+ i +'"/>'+
                            '<span>'+ option +'</span>'+
                            '</div>');

                        $alertConfirmRadio.find('.radioDiv').append($option);
                    }
                }


                $alertConfirmRadio.find('.alertBody').find('input[name="setType"]').first().prop('checked',true);
                $alertConfirmRadio.find('p.title').text(title);
                $alertConfirmRadio.find('p.content').text(content);

                var yesFunction = data.yesFunction;
                var noFunction = data.noFunction;
                var yesFunctionData = data.yesFunctionData;
                var noFunctionData = data.noFunctionData;

                $alertConfirmRadio.find('.addFinish').off('click').on('click', function(){

                    var inputVal = $alertConfirmRadio.find('.alertBody').find('input[name="setType"]:checked').val();

                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunctionData.unshift(inputVal);
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();
                });

                $alertConfirmRadio.find('.addCancel').off('click').on('click', function(){

                    var inputVal = $alertConfirmRadio.find('.alertBody').find('input[name="setType"]:checked').val();

                    if(isBlankVariable(noFunctionData) || noFunctionData.length == 0){
                        if(!isBlankVariable(noFunction)){
                            noFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(noFunction)){
                            noFunctionData.unshift(inputVal);
                            noFunction.apply(document, noFunctionData);
                        }
                    }
                    close();
                });
                $alertConfirmRadio.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertConfirmRadio.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertConfirmRadio.css('z-index',parseInt(maxIndex,10)+2);
            }

            // 弹出select选择
            function confirmSelect(data){

                if(!isLoadBackAlert){
                    $('body').append($backAlert);
                    isLoadBackAlert = true;
                }
                if(!isLoadConfirmSelect){
                    $('body').append($alertConfirmSelect);
                    isLoadConfirmSelect = true;
                }

                $backAlert.css('display','block');
                $alertConfirmSelect.css('display','block');

                var title = !isBlankVariable(data.title)?data.title:'';
                var describe = !isBlankVariable(data.describe)?data.describe:'';
                var content = !isBlankVariable(data.content)?data.content:'';

                if(!isBlankVariable(data.options)){
                    $alertConfirmSelect.find('select').empty();
                    for(var i in data.options){
                        var option = data.options[i];
                        var $option = $(''+
                            '<option value="'+ i +'">'+ option +'</option>' +
                            '');

                        $alertConfirmSelect.find('select').append($option);
                    }
                }


                $alertConfirmSelect.find('p.title').text(title);
                $alertConfirmSelect.find('p.describe').text(describe);
                $alertConfirmSelect.find('p.content').text(content);

                var yesFunction = data.yesFunction;
                var noFunction = data.noFunction;
                var yesFunctionData = data.yesFunctionData;
                var noFunctionData = data.noFunctionData;

                $alertConfirmSelect.find('.addFinish').off('click').on('click', function(){

                    var inputVal = $alertConfirmSelect.find('.alertBody').find('select').val();

                    if(isBlankVariable(yesFunctionData) || yesFunctionData.length == 0){
                        if(!isBlankVariable(yesFunction)){
                            yesFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(yesFunction)){
                            yesFunctionData.unshift(inputVal);
                            yesFunction.apply(document, yesFunctionData);
                        }
                    }
                    close();
                });

                $alertConfirmSelect.find('.addCancel').off('click').on('click', function(){

                    var inputVal = $alertConfirmSelect.find('.alertBody').find('input[name="setType"]:checked').val();

                    if(isBlankVariable(noFunctionData) || noFunctionData.length == 0){
                        if(!isBlankVariable(noFunction)){
                            noFunction(inputVal);
                        }
                    } else {
                        if(!isBlankVariable(noFunction)){
                            noFunctionData.unshift(inputVal);
                            noFunction.apply(document, noFunctionData);
                        }
                    }
                    close();
                });
                $alertConfirmSelect.children('.alertTitle').children('p+p').off('click').on('click',function(){
                    close();
                });

                function close(){
                    $backAlert.css('display','none');
                    $alertConfirmSelect.css('display','none');
                }

                var maxIndex = 0;
                $('body').find('*').each(function(){
                    var zIndex = parseInt($(this).css('z-index'),10);
                    if(zIndex > maxIndex){
                        maxIndex = zIndex;
                    }
                });

                $backAlert.css('z-index',parseInt(maxIndex,10)+1);
                $alertConfirmSelect.css('z-index',parseInt(maxIndex,10)+2);
            }


            return {
                notice:notice,
                alert:alert,
                confirm:confirm,
                confirmInput:confirmInput,
                confirmExport:confirmExport,
                confirmRadio:confirmRadio,
                confirmSelect:confirmSelect
            };

        })();


        // input输入框添加限制
        function handleInputEvent(input, type, limitNumber){

            var $input = $(input);

            $input.each(function(){
                var $this = $(this);

                if($this.data('functionMap') == null){

                    var functionMap = {
                        int:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var value = String($this.val());
                            value = value.replace(/[^0-9]/g,'');
                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        negInt:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var value = String($this.val());
                            value = value.replace(/[^-0-9]/g,'');
                            value = value.replace(/^-/,'=');
                            value = value.replace(/[-]/g,'');
                            value = value.replace(/[=]/,'-');
                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        float:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var value = String($this.val());
                            value = value.replace(/[^0-9.]/g,'');
                            value = value.replace(/[.]/,'=');
                            value = value.replace(/[.]/g,'');
                            value = value.replace(/[=]/,'.');
                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        negFloat:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var value = String($this.val());
                            value = value.replace(/[^-0-9.]/g,'');
                            value = value.replace(/[.]/,'=');
                            value = value.replace(/[.]/g,'');
                            value = value.replace(/[=]/,'.');
                            value = value.replace(/^-/,'=');
                            value = value.replace(/[-]/g,'');
                            value = value.replace(/[=]/,'-');
                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        floatN:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var floatNumber = $this.data('floatN');
                            var value = String($this.val());

                            value = value.replace(/[^0-9.]/g,'');
                            value = value.replace(/[.]/,'=');
                            value = value.replace(/[.]/g,'');
                            value = value.replace(/[=]/,'.');

                            value1 = value.split('.')[0] + '.';
                            if(value.split('.')[1]){
                                value = value1 + value.split('.')[1].slice(0,floatNumber);
                            }


                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        negFloatN:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var floatNumber = $this.data('negFloatN');
                            var value = String($this.val());

                            value = value.replace(/[^-0-9.]/g,'');
                            value = value.replace(/[.]/,'=');
                            value = value.replace(/[.]/g,'');
                            value = value.replace(/[=]/,'.');
                            value = value.replace(/^-/,'=');
                            value = value.replace(/[-]/g,'');
                            value = value.replace(/[=]/,'-');

                            value1 = value.split('.')[0] + '.';
                            if(value.split('.')[1]){
                                value = value1 + value.split('.')[1].slice(0,floatNumber);
                            }

                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        name:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var cpLock = $this.data('cpLock');
                            var value = String($this.val());
                            if(!cpLock){
                                value = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9-]/g,'');
                            }
                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        },
                        percent:function(){

                            if(getIEVer() <= 8){
                                if($(this)[0] != document.activeElement){
                                    return;
                                }
                            }

                            var $this = $(this);
                            var value = String($this.val());

                            value = value.replace(/[^0-9.]/g,'');
                            value = value.replace(/[.]/,'=');
                            value = value.replace(/[.]/g,'');
                            value = value.replace(/[=]/,'.');

                            if(parseFloat(value) > 100){
                                if(value.split('.')[1]){
                                    value = value.split('.')[0].slice(0,2) + '.' + value.split('.')[1];
                                } else {
                                    value = value.split('.')[0].slice(0,2);
                                }
                            }

                            if($this.val() !== value){
                                var caretPos = getCaretPosition($this[0]).start;
                                caretPos = caretPos>=1 ? caretPos-1 : 0;
                                $this.val(value);
                                setCaretPosition($this[0],caretPos);
                            }
                        }
                    };

                    $this.data('functionMap',functionMap);
                }

                var inputHandle = $this.data('functionMap')['name'];
                if(!isBlankVariable(type)){
                    if(type == 'int' || type == 'negInt' || type == 'float' || type == 'negFloat' || type == 'name' || type == 'percent'){
                        inputHandle = $this.data('functionMap')[type];
                    } else if (type.slice(0,5) == 'float'){

                        $this.data('floatN',parseInt(type.slice(5),10));

                        inputHandle = $this.data('functionMap')['floatN'];
                    } else if (type.slice(0,8) == 'negFloat'){

                        $this.data('negFloatN',parseInt(type.slice(8),10));

                        inputHandle = $this.data('functionMap')['negFloatN'];
                    }
                }


                $this.data('cpLock',false);

                if($this.data('compositionstart') == null){
                    function compositionstart(){
                        $(this).data('cpLock',true);
                    }
                    $this.data('compositionstart',compositionstart);
                }
                if($this.data('compositionend') == null){
                    function compositionend(){
                        $(this).data('cpLock',false);
                    }
                    $this.data('compositionend',compositionend);
                }

                $this.off('compositionstart',$this.data('compositionstart')).on('compositionstart',$this.data('compositionstart'));
                $this.off('compositionend',$this.data('compositionend')).on('compositionend',$this.data('compositionend'));

                if('oninput' in $this[0]){
                    $this.off('input',inputHandle).on('input',inputHandle);
                }else{
                    $this.off('propertychange',inputHandle).on('propertychange',inputHandle);
                }

                if(isBlankVariable(limitNumber)){
                    limitNumber = '16';
                } else {
                    limitNumber = parseInt(limitNumber,10);
                    limitNumber = limitNumber.toString();
                }
                $(this).attr('size',limitNumber);
                $(this).attr('maxlength',limitNumber);
                $(this).attr('autocomplete','off');

            });
        }

        // 权限
        function getPermission(){
            var quanXian = {};

            var permission = {

                'sm3_01':'privateRanking.html',//全市场排名
                'sm3_02':'themeScreen.html',//主题筛选
                'sm3_0301':'fillProduce.html',//内部排名及评价
                'sm3_0302':'concernedProducts.html',//关注的产品
                'sm3_0603':'groupManage.html',//组合管理
                'sm3_0604':'myDefinedReport.html',// 自定义报表
                'sm3_0602':'groupConfigure.html', //组合配置
                'sm3_0303':'myConcernAdviser.html',//关注的投顾
                'sm3_0307':'manage.html',//后台管理
                'sm3_0601':'fillFundList.html',//私募填报
                'sm3_0401':'simuIndex.html',//朝阳私募指数
                'sm3_0402':'simuMarketData.html',//私募市场统计
                'sm3_05_01':'searchReport.html',//券商研报
                'sm3_05_02':'zyReport.html',//朝阳研报
                'sm3_05_03':'marketInformation.html',//市场咨询
                'sm3_09_01':'alternativePool.html',//备选池管理
                'sm3_09_02':'assetsAllocation.html',//大类资产配置
                'sm3_09_03':'fofSolutionPool.html'//fof方案池
            };

             var pm = getCookie('pm');
             if(pm){
                    try{
                        var  pmArry = JSON.parse(pm);
                        pmArry = JSON.parse(pmArry);
                        for(var i =0;i<pmArry.length; i++){
                            var pm = pmArry[i];
                            if(permission[pm]){
                                quanXian[permission[pm]] = 1;
                            }
                        }
                    }catch(err){

                    }
                }
             return quanXian;
        }


        // 给IE8/9加placeholder
        function addPlaceholder(input){
            var supportPlaceholder='placeholder' in document.createElement('input');

            //当浏览器不支持placeholder属性时

            if(isBlankVariable(input)){
                input = $('input[placeholder]');
            }

            if(!supportPlaceholder){

                $(input).each(function(){

                    var $input = $(this);
                    if($input.attr("type") == "text" && !($input.hasClass('form-control') && $input.parent().hasClass('date'))){

                        var placeholder = $input.attr("placeholder");

                        if($input.hasClass('placeholder')){
                            return true;
                        }

                        $input.data('background-color',$input.css('background-color'));
                        $input.css({
                            'background-color':'transparent'
                        });

                        var width = $input.outerWidth();
                        var height = $input.outerHeight();

                        var $phInputDiv = $('<div class="phInputDiv"><input type="text" class="placeholder"/></div>');
                        $phInputDiv.css({
                            'width':'0',
                            'height':'0',
                            'display':$input.css('display'),
                            'overflow':'visible'
                        });

                        if($input.css('display') == 'block'){
                            $phInputDiv.css({
                                'width':'100%',
                                'display':'block',
                                'top':$input.css('margin-top')
                            });
                        }

                        if($input.css('float')){
                            $phInputDiv.css('float',$input.css('float'));
                        }

                        var $phInput = $phInputDiv.children('input');
                        $phInput.prop('readonly',true);
                        $phInput.val(placeholder);

                        $phInput.css('background-color',$input.data('background-color'));
                        $phInput.css({
                            'border':$input.css('border'),
                            'margin':$input.css('margin'),
                            'padding':$input.css('padding'),
                            'height':$input.css('height'),
                            'line-height':$input.css('line-height'),
                            'display':$input.css('display'),
                            'border-color':'transparent',
                            'position':'relative',
                            'top':'0',
                            'color':'#999999'
                        });


                        if(getIEVer() == 8)
                        {
                            if($input.data('inputHandle') == null){
                            }

                            function inputHandle(e){
                                if($(this).val() == ''){
                                    $phInput.css('visibility','visible');
                                    if($input.css('background-color') != 'transparent'){
                                        $input.css('background-color','transparent');
                                    }
                                } else {
                                    $phInput.css('visibility','hidden');
                                    if($input.css('background-color') != $input.data('background-color')){
                                        $input.css('background-color',$input.data('background-color'));
                                    }
                                }
                            }
                            // ie8
                            if('oninput' in $input[0]){
                                $input.off('input',$input.data('inputHandlePlace'));
                                $input.data('inputHandlePlace',inputHandle);
                                $input.on('input',$input.data('inputHandlePlace'));
                            }else{
                                $input.off('propertychange',$input.data('inputHandlePlace'));
                                $input.data('inputHandlePlace',inputHandle);
                                $input.on('propertychange',$input.data('inputHandlePlace'));
                            }

                            if($phInput.data('focus') == null){

                                function focus(){
                                    $phInput.trigger('blur');
                                    $input.trigger('focus');
                                }
                                $phInput.data('focus',focus);
                            }

                            $phInput.off('focus',$phInput.data('focus')).on('focus',$phInput.data('focus'));
                        }

                        if(getIEVer() == 9)
                        {
                            // ie9
                            if($phInput.data('focus') == null){
                                function focus(){
                                    $phInput.css('visibility','hidden');
                                    $input.css('background-color',$input.data('background-color'));
                                    $input.trigger('focus');
                                }
                                $phInput.data('focus',focus);
                            }
                            $phInput.off('focus',$phInput.data('focus')).on('focus',$phInput.data('focus'));


                            function blur(){
                                if($(this).val() == ''){
                                    $phInput.css('visibility','visible');
                                    $input.css('background-color','transparent');
                                }
                            }
                            if($input.data('blurPlace') != null){
                                $input.off('blur',$input.data('blurPlace'));
                            }
                            $input.data('blurPlace',blur);
                            $input.on('blur',$input.data('blurPlace'));
                        }

                        $input.prev().filter('.phInputDiv').remove();
                        $input.before($phInputDiv);

                        if($input.val() != ''){
                            $phInput.css('visibility','hidden');
                        }
                    }
                });
            }
        }


        // 拖拽移动
        function handleDragMove(drag,move,topPadding){

            if(isBlankVariable(topPadding)){
                topPadding = 62;
            }

            var leftRightPadding = 60;
            var bottomPadding = 2;

            var $drag = $(drag);
            $drag.css({
                'cursor':'default',
                '-moz-user-select':'none',
                '-webkit-user-select':'none',
                '-ms-user-select':'none',
                'user-select':'none'
            });
            $drag.attr('unselectedable','on');
            $drag.attr('onselectstart','return false;');
            $drag.attr('onselect','return false;');
            $drag.attr('ondragstart','return false;');

            var $move = $(move);

            var isMove = false;
            var firstMove = false;

            if($drag.data('dragMousedown') == null){
                function mousedown(){
                    isMove = true;
                    firstMove = true;
                }
                $drag.data('dragMousedown',mousedown);
            }

            if($drag.data('dragMouseup') == null){
                function mouseup(){
                    isMove = false;
                    firstMove = false;
                }
                $drag.data('dragMouseup',mouseup);
            }

            if($drag.data('dragMousemove') == null){
                var pageX = 0;
                var pageY = 0;
                function moveHandle(e){

                    if($move.css('position') != 'fixed'){
                        return;
                    }


                    if(isMove){
                        if(firstMove){
                            pageX = mousePos(e).x;
                            pageY = mousePos(e).y;
                            firstMove = false;

                            topPadding = $('#page-head').innerHeight() + 2;
                            return;
                        }


                        var offset = null;
                        var ua=window.navigator.userAgent;
                        if(/Chrome/g.test(ua)){
                            offset = getFixedOffset($drag);
                        }else{
                            topDistance = $drag.offset().top - $('html').scrollTop();
                            leftpDistance = $drag.offset().left - $('html').scrollLeft();
                            offset = {
                                top:topDistance,
                                left:leftpDistance
                            }
                        }

                        var dragWidth = $drag.innerWidth();
                        var dragHeight = $drag.innerHeight();

                        offset.right = offset.left + dragWidth;
                        offset.bottom = offset.top + dragHeight;


                        var deltaX = e.pageX - pageX;
                        var deltaY = e.pageY - pageY;


                        if(offset.top < topPadding && deltaY < 0){
                            return;
                        }
                        if(offset.right < leftRightPadding  && deltaX < 0){
                            return;
                        }
                        if(offset.left > ($(window).innerWidth() - leftRightPadding) && deltaX > 0){
                            return;
                        }
                        if(offset.bottom > ($(window).innerHeight() - bottomPadding) && deltaY > 0){
                            return;
                        }


                        $move.css('left', parseInt($move.css('left'),10) + deltaX + 'px');
                        $move.css('top', parseInt($move.css('top'),10) + deltaY + 'px');

                        if(!(/Firefox/g.test(ua))){
                            if($move.css('bottom') != 'auto'){
                                $move.css('bottom', parseInt($move.css('bottom'),10) - deltaY + 'px');
                            }
                            if($move.css('right') != 'auto'){
                                $move.css('right', parseInt($move.css('right'),10) - deltaX + 'px');
                            }
                        }

                        pageX = e.pageX;
                        pageY = e.pageY;
                    }
                }
                $drag.data('dragMousemove',moveHandle);
            }

            $drag.off('mousedown',$drag.data('dragMousedown')).on('mousedown',$drag.data('dragMousedown'));

            // 区别ie8
            if(getIEVer()<=8){
                $('html').off('mousemove',$drag.data('dragMousemove')).on('mousemove',$drag.data('dragMousemove'));

                $('html').off('mouseup',$drag.data('dragMouseup')).on('mouseup',$drag.data('dragMouseup'));
            } else {

                $(window).off('mousemove',$drag.data('dragMousemove')).on('mousemove',$drag.data('dragMousemove'));

                $(window).off('mouseup',$drag.data('dragMouseup')).on('mouseup',$drag.data('dragMouseup'));
            }


            function mousePos(e){
                var x,y;
                var e = e||window.event;
                return {
                    x:e.clientX+document.body.scrollLeft + document.documentElement.scrollLeft,
                    y:e.clientY+document.body.scrollTop + document.documentElement.scrollTop
                };
            };



        }


        // 增减逗号分隔符
        // input输入框增减逗号
        function addSeparator(input){
            var $input = $(input);
            $input.each(function(){
                var $this = $(this);

                if($this.attr("type") == "text"){

                    $this.attr('separator','true');

                    if($this.data('sepBlur') == null){
                        function inputBlur(){
                            $(this).val(addComma($(this).val()));
                        }
                        $this.data('sepBlur',inputBlur);
                    }
                    $this.on('blur',$this.data('sepBlur'));

                    if($this.data('sepFocus') == null){
                        function inputFocus(){
                            $(this).val(removeComma($(this).val()));
                            setCaretPosition($(this)[0],$(this).val().length);
                        }
                        $this.data('sepFocus',inputFocus);
                    }
                    $this.on('focus',$this.data('sepFocus'));
                }
            });
        }
        function addComma(count){
            var countStr = count.toString();
            var isNeg = false;
            if(countStr[0] === '-'){
                isNeg = true;
                countStr = countStr.slice(1);
            }

            var intStr = countStr.split('.')[0];
            var numArray = [];
            for(var i = intStr.length - 3; (i + 3) > 0;i-=3){
                if(i<0){
                    numArray.push(intStr.substr(0,3+i));
                } else{
                    numArray.push(intStr.substr(i,3));
                }
            }
            numArray.reverse();

            var numStr = '';
            if(isBlankVariable(countStr.split('.')[1])){
                numStr = numArray.join(',');
            } else {
                numStr = numArray.join(',') +'.'+ countStr.split('.')[1];
            }
            if(isNeg){
                return '-' + numStr;
            } else {
                return numStr;
            }

        }
        function removeComma(count){
            var countStr = count.toString();
            return countStr.replace(/[,]/g,'');
        }
        var valFunction = $.fn.val;
        $.fn.extend({
            val:function(option){
                if($(this).attr("type") == "text" && $(this).attr('separator') === 'true'){

                    if(arguments[0] == null){
                        return removeComma(valFunction.apply($(this),arguments));
                    } else {
                        if($(this)[0] == document.activeElement){
                            arguments[0] = removeComma(arguments[0]);
                            return valFunction.apply($(this),arguments);
                        } else {
                            arguments[0] = addComma(removeComma(arguments[0]));
                            return valFunction.apply($(this),arguments);
                        }
                    }
                } else {
                    return valFunction.apply($(this),arguments);
                }
            }
        });
        // String Number 加逗号分隔符
        String.prototype.addComma = function(){
            if(/^-?[0-9]+\.?[0-9]*$/.test(this)){
                return addComma(this);
            } else {
                return this.toString();
            }
        };
        Number.prototype.addComma = function(){
            if(/^-?[0-9]+\.?[0-9]*$/.test(this.toString())){
                return addComma(this.toString());
            } else {
                return this.toString();
            }
        };
        ////////////////////////////////////////////////////////////////////////
        $(window).on('click',function (){
            $('.-jump-ul-').css('display','none');

        });
        //多选下拉框
        var multiSelect = (function(){

            function classification(cn){
                var dropHtml = $(
                    '<div class="-comboBox-"> ' +
                    '<div class="requirement"></div> ' +
                    '<div class="icon"> ' +
                    '<span class="glyphicon glyphicon-triangle-bottom"></span>' +
                    '</div> ' +
                    '</div> '
                );
                dropHtml.on('click',function(e){
                    if($(this).siblings().css('display') == 'block'){
                        $(this).siblings().css('display','none');
                    }else{
                        $(this).siblings().css('display','block');
                    }
                    $(this).parent().siblings().find('.-jump-ul-').css('display','none');

                    e.stopPropagation();
                });

                $('.-jump-ul-').on('click',function(e){
                    e.stopPropagation();
                });



                dropHtml.find('.requirement').text(cn);
                return dropHtml;
            }
            return classification;
        }());

        ////单选下拉框
        var singleSelect = (function(){

            function classification(cn){

                var dropHtml = $(
                    '<div class="-comboBox-"> ' +
                    '<div class="requirement"></div> ' +
                    '<div class="icon"> ' +
                    '<span class="glyphicon glyphicon-triangle-bottom"></span>' +
                    '</div> ' +
                    '</div> '
                );

                dropHtml.on('click',function(e){
                    if($(this).siblings().css('display') == 'block'){
                        $(this).siblings().css('display','none');
                    }else{
                        $(this).siblings().css('display','block');
                    }
                    $(this).parent().siblings().find('.-jump-ul-').css('display','none');
                    $(this).parents('.searchActionRow').siblings().find('.-jump-ul-').css('display','none');
                    e.stopPropagation();
                });
                //dropHtml.on('mouseover',function(e){
                //    $(this).siblings().css('display','block');
                //    return false;
                //});


                $('.-jump-ul-').on('click',function(e){
                    e.stopPropagation();
                });
                $('.-jump-ul-').children('.single').find('li').on('click',function(){
                    var liText=$(this).text();
                    $(this).parents('.-jump-ul-').siblings('.-comboBox-').find('.requirement').text(liText);
                    $(this).parents('.-jump-ul-').css('display','none');
                });

                dropHtml.find('.requirement').text(cn);
                return dropHtml;
            }
            return classification;
        }());



        // 当前日期 如 2016-10-08

        var getStrDate = function(date){

            var month = ((date.getMonth()+1)+100).toString().slice(1,3);
            var day = ((date.getDate())+100).toString().slice(1,3);
            var strDate = [date.getFullYear(),month,day].join('-');

            return strDate;
        };
        var getNowDate = function (){
            var date = new Date();
            return getStrDate(date);
        };

        var getRecentYears = function(number){
            var num = parseInt(number,10);
            if(isNaN(num)){
                return [];
            }

            var date = new Date();
            var currentYear = parseInt(date.getFullYear(),10);

            var recentYearArray = [];
            for(var i = 1; i<=num; i++){
                recentYearArray.push(currentYear-i);
            }

            return recentYearArray;
        };

        (function(){
            $.fn.disableEvent = function(eventType,trueOrFalse){
                if(trueOrFalse){
                    if($(this).children('.--coverBtn--').size() <= 0){
                        $cover = $('<div class="--coverBtn--"></div>');
                        $cover.css({
                            'position': 'absolute',
                            'top':'0',
                            'left': '0',
                            'right': '0',
                            'bottom': '0',
                            'display': 'inline-block',
                            'background-color': 'transparent',
                            'z-index': '1',
                            'cursor': 'no-drop'
                        });
                        $cover.on(eventType,function(e){
                            e.preventDefault();
                            e.stopPropagation();
                        });
                        $(this).append($cover);
                    }
                } else {
                    $(this).children('.--coverBtn--').remove();
                }
            };
        })();



        return {
            getIEVer: getIEVer,
            getUrlParam: getUrlParam,
            getCookie: getCookie,
            getLevelDomain: getLevelDomain,
            setSession: setSession,
            setCookie: setCookie,
            delCookie: delCookie,
            clrCookie: clrCookie,
            delSldCookie: delSldCookie,
            delPldCookie: delPldCookie,
            clrLsldCookie: clrLsldCookie,
            clrLldCookie: clrLldCookie,
            getClientType: getClientType,
            getToken:getToken,
            absUrl: absUrl,
            isValidVariable: isValidVariable,
            isBlankVariable: isBlankVariable,
            hasExpectProp: hasExpectProp,
            isHTMLElement: isHTMLElement,
            getFixedScroll: getFixedScroll,
            getFixedOffset: getFixedOffset,
            getSameDateNYearsAgo: getSameDateNYearsAgo,
            getSameDateNMonthsAgo: getSameDateNMonthsAgo,
            prefixInteger: prefixInteger,
            getLocalTimeString: getLocalTimeString,
            getUTCTimeString: getUTCTimeString,
            getPRCTimeString: getPRCTimeString,
            getDateFromPRCStr: getDateFromPRCStr,
            isLeapYear: isLeapYear,
            getCaretPosition: getCaretPosition,
            setCaretPosition: setCaretPosition,
            normalizeDateString: normalizeDateString,

            notice:alertOptions.notice,
            alert:alertOptions.alert,
            confirm:alertOptions.confirm,
            confirmInput:alertOptions.confirmInput,
            confirmExport:alertOptions.confirmExport,
            confirmRadio:alertOptions.confirmRadio,
            confirmSelect:alertOptions.confirmSelect,
            handleInputEvent:handleInputEvent,
            getPermission:getPermission,
            addPlaceholder:addPlaceholder,
            handleDragMove:handleDragMove,
            addSeparator:addSeparator,
            multiSelect:multiSelect,
            singleSelect:singleSelect,
            getStrDate:getStrDate,
            getNowDate:getNowDate,
            getRecentYears:getRecentYears

        }
    }
);