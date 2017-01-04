/**
 * Created by fengliang on 2016/12/7.
 */
define(
    ['jquery','util','dataService'],
    function($,util,ds){
        $.fn.searchInput = function(dataMap){
            var $this = $(this);
            var $dropUl = $('<ul class="-dropUl-"></ul>');
            $this.after($dropUl);

            var requestFunction = dataMap.request;
            var liClickFunction = dataMap.liClickFunction;
            var fieldName = dataMap.fieldName;
            var getName = dataMap.getName;
            var getID = dataMap.getID;
            var getType = dataMap.getType;
            var $liTop = 0;

            function searchContent(){
                var query = {};
                query[fieldName] = $this.val();
                if(getType != undefined){
                    query[getType] = 1
                }
                ds.handleDataResponse({
                    dataResponse: requestFunction(query),
                    callback0:function(data){
                        $dropUl.empty();
                        $.each(data,function(index){
                            var item=this;
                            var $tableLi = $('<li class="-dropLi-" data-value="'+item[getID]+'"><a href="javascript:;">'+ item[getName] +'</a></li>');
                            if(index == 0){
                                $tableLi.addClass('licolor');
                            }
                            $dropUl.append($tableLi);
                            $dropUl.css('display','block');

                        });
                        $('.-dropLi-').mouseover(function(){
                            $(this).addClass('licolor');
                            $(this).siblings().removeClass('licolor');
                            $liTop = util.getFixedOffset($('.licolor')).top;
                            //console.log($liTop)
                        });
                        //$('.-dropLi-').mouseout(function(){
                        //    $(this).removeClass('licolor');
                        //});
                    },
                    callback1001:function(){
                        $dropUl.empty();
                        var $tableLi = $('<li style="line-height: 30px">未查询到相应结果</li>');
                        $dropUl.append($tableLi);
                        $dropUl.css('display','block');
                    },
                    callbackException: function(){
                    },
                    afterResponse: function (){
                        $dropUl.css({
                            'border':'1px solid #e1e0e0'
                        });
                    }
                });
            }

            function searchInputDropLiClick(){
                var liName = $(this).children('a').text();
                var liId = $(this).attr('data-value');
                $this.val(liName);
                liClickFunction(liName,liId);
            }
            $dropUl.off('click','.-dropLi-',$dropUl.data('searchInputDropLiClick'));
            $dropUl.data('searchInputDropLiClick',searchInputDropLiClick);
            $dropUl.on('click','.-dropLi-',$dropUl.data('searchInputDropLiClick'));

            function searchInputFocus(){
                if(fieldName == '' && getID == '' && getName == ''){
                    return;
                }
                $dropUl.css('display','block');
            }
            $this.off('focus',$this.data('searchInputFocus'));
            $this.data('searchInputFocus',searchInputFocus);
            $this.on('focus',$this.data('searchInputFocus'));


            $this.blur(function(){
                setTimeout(function(){
                    $dropUl.css('display','none');
                },250);

            });

            var ulScroll = 0;
            $dropUl.scroll(function(){
                ulScroll = $dropUl.scrollTop();
                //console.log(ulScroll);

            });
            function searchInputKeyUp(e){

                var $curLi = $dropUl.children('li.licolor');
                var $ulHeight = $dropUl.height();
                var $ulTop = util.getFixedOffset($dropUl).top+1;
                var $liHeight = $('.licolor').height();

                if(e.keyCode == 38){
                    if($curLi.prev().length > 0){

                        $curLi.toggleClass('licolor',false);
                        $curLi.prev().toggleClass('licolor',true);
                        $liTop = util.getFixedOffset($('.licolor')).top;

                        if($liTop - $ulTop < 0){
                            ulScroll= ulScroll-$curLi.height();
                            $dropUl.scrollTop(ulScroll,0);

                        }
                        //if($liTop<$ulHeight){
                        //    $dropUl.scrollTop($liTop,0);
                        //}
                        var isTop = $('.licolor').position().top;
                        var prevNum = $curLi.prevAll().length;


                        if(isTop<0){
                            $dropUl.scrollTop((prevNum-2)*$liHeight,0);
                        }else if(isTop>$ulHeight){
                            $dropUl.scrollTop((prevNum-1)*$liHeight,0);
                        }
                        //console.log(isTop);
                        //console.log((prevNum-1)*$liHeight);
                    }else{
                        $dropUl.scrollTop(0,0);
                    }
                }else if(e.keyCode == 40){
                    if($curLi.next().length > 0){

                        $curLi.toggleClass('licolor',false);
                        $curLi.next().toggleClass('licolor',true);
                        $liTop = util.getFixedOffset($('.licolor')).top;

                        if($liTop-$ulTop >= $ulHeight) {
                            ulScroll= ulScroll+$curLi.height();
                            $dropUl.scrollTop(ulScroll,0);
                        }

                        var isTop = $('.licolor').position().top;
                        var nextNum = $curLi.nextAll().length;
                        var prevNum = $curLi.prevAll().length;

                        if(isTop<0){
                            $dropUl.scrollTop((prevNum-2)*$liHeight,0);
                        }else if(isTop>$ulHeight){
                            $dropUl.scrollTop((prevNum-1)*$liHeight,0);
                        }

                        //console.log(isTop);
                        //console.log($ulHeight);
                        //console.log();
                    }else{
                        $dropUl.scrollTop(($dropUl.children('li').length)*$liHeight-$ulHeight,0);
                        console.log(($dropUl.children('li').length)*$liHeight);
                    }
                }else if(e.keyCode == 13){
                    $this.val($dropUl.children('li.licolor').text());
                    var liId = $dropUl.children('li.licolor').attr('data-value');
                    liClickFunction(null,liId);
                    $dropUl.css('display','none');
                }else{
                    //ulScroll = 0;
                    var textval=$this.val();
                    if(textval.length>0){
                        if(fieldName == '' && getID == '' && getName == ''){
                            return;
                        }
                        setTimeout(function(){
                            searchContent();
                        },100)
                    }
                    $dropUl.empty();
                }

            }

            $this.off('keyup',$this.data('searchInputKeyUp'));
            $this.data('searchInputKeyUp',searchInputKeyUp);
            $this.on('keyup',$this.data('searchInputKeyUp'));
        };
    }
);
