function normalize(name)
{
    var decoded  = decodeURIComponent(name);
    var replaced = decoded.replace(/\(.*\)/,"");
    var trimmed = replaced.trim().toUpperCase();
    return trimmed;
}

function MovieHandler(target, name){
    this.target = target;
    this.name   = name;
}


function MovieHandler(target, name, callback){
    this.target = target;
    this.name   = name;
    this.callback = callback;
}

MovieHandler.prototype.getTarget = function(){
    return this.target;
}

MovieHandler.prototype.setOrder = function(order){
    this.order = order;
}

MovieHandler.prototype.getOrder = function(){
    return this.order;
}
function updateMovie(c, a, obj){
    console.log("critics_score is :" + c + " order:" + obj.getOrder() );
    if(c >0){
        $(obj.target).attr("cscore", c);
    }else{
        $(obj.target).attr("cscore", 0);
    }

    console.log("audience_score is :" + a );
    if(a >0){
        $(obj.target).attr("ascore", a);
    }else{
        $(obj.target).attr("ascore", 0);
    }
    if(obj.callback){
        obj.callback();
    }
    if(obj.getOrder() == 0){
        sortMovies();
    }
        
}

function getRankings(movieHandler, onSuccess) {
    var movie = movieHandler.name;
    console.log("movie is :" + movie);
    $.ajax({
        type: "GET",
        url: "http://rbxrank.aws.af.cm/add",
        data: "id=" + movie + "&access_token=B8CF722F917D&update=1" ,
        context: movieHandler,
        dataType: 'json', 
        success: onSuccess,
        error: function(jqXHR, textStatus, errorThrown){
                  console.log("textStatus:" + textStatus + " error:" + errorThrown);
        },
    });
}
function responseHandler(ratings)
{
    updateMovie(ratings.critics_score, ratings.audience_score, this);
}

function findRanking(movieHandler)
{
    try{
        getRankings(movieHandler, responseHandler);
    }catch(err){
        console.log("Exception:" + err);
    }
}

function displayRanking(p, obj, selector, cscoreOnly, displayNonRated,  rottenC, freshC, rottenA, freshA){
    console.log("displayranking :", cscoreOnly);
    if(obj != p){
        p.prepend(obj); 
    }
    var c = $(obj).attr("cscore");
    if(c >= 1 && c <=60){
        $(selector, p).append(rottenC.replace("{SCORE}", c)); 
    }else if( c > 60 ){
        $(selector, p).append(freshC.replace("{SCORE}", c));
    }else{
        if(displayNonRated == true){ 
            $(selector, p).append("<span class='ratings'>No ratings yet.</span>");
        }

    }
    if(cscoreOnly == false){
        var a = $(obj).attr("ascore");
        if(a >= 1 && a <=60){
            $(selector, p).append(rottenA.replace("{SCORE}", a)); 
        }else if( a > 60 ){
            $(selector, p).append(freshA.replace("{SCORE}", a)); 
        }else{
            if(displayNonRated == true){ 
                $(selector, p).append("<span class='ratings'>No ratings yet.</span>");
            }
        }
    }
}


function sortMovies(){
    var listitems = $('div[cscore]');
    if(listitems.length < 1){
        console.log("unable to find movies");
        return;
    }
    console.log("Sorting " + listitems.length + " movies");
    var p = $(listitems[0]).parent();
    listitems.sort(function(a, b) {
               return $(a).attr("cscore") - $(b).attr("cscore");
               });
    $.each(listitems, function(i, obj) { 
            $(obj).append("<div class='rbxrank_elem' id='rbxrank_"+ i+ "'/>");
            displayRanking(p, obj, "#rbxrank_"+ i, true, false,
                "<span class='icon tiny rotten'>&nbsp;</span>{SCORE}%", 
                "<span class='icon tiny fresh'>&nbsp;</span>{SCORE}%");
    });
    console.log("Done sorting.");
}

function schedule(){
    console.log("schedule invoked. queue size=" + movieHandlers.length);
    var i =0;
    var movieHandler;
    while((i < 3) && (movieHandlers.length > 0)){
        movieHandler = movieHandlers.shift();
        movieHandler.setOrder(movieHandlers.length);
        var name = $(movieHandler.getTarget()).attr('name');
        if(name != null){
            console.log("Querying movie:" + name);
            findRanking(movieHandler);
            i++;
        }
    }
    if(i == 3){
        setTimeout(schedule, 2000);
    }
}

function displayRankingCallback()
{
    var obj = this.getTarget();
    var p = $(obj).parent();
    displayRanking(p, obj, ".rbxrank_group",  false, true, 
            "<div class='ratings'><div class='icon rotten_tomato'></div><div class='rbxrank_text'>{SCORE}</div><span class='rbxrank_pc'>%</span></div>", 
            "<div class='ratings'><div class='icon fresh_tomato'></div><div class='rbxrank_text'>{SCORE}</div><span class='rbxrank_pc'>%</span></div>", 
            "<div class='ratings'><div class='icon rotten_bucket'></div><div class='rbxrank_text'>{SCORE}</div><span class='rbxrank_pc'>%</span></div>", 
            "<div class='ratings'><div class='icon fresh_bucket'></div><div class='rbxrank_text'>{SCORE}</div><span class='rbxrank_pc'>%</span></div>");
}
function normalize_urlmovie(name){
    var name1 = name.replace(new RegExp("-blu-ray"), "");
    var name2 = name1.replace(/\-/g, " ");
    return name2;
}
var movieHandlers = new Array();
var path = window.location.pathname;
var elems = path.split("/");
console.log("path: " + path + " split:" + elems.length);
if(elems.length == 3){
    //on a movie page 
    var heading  = $("h1[itemprop=name]");
    if(heading){
        var movie = normalize($(heading).text());
        console.log("name of the movie:"+ movie);
        if(movie){
            var obj  = $("h1[itemprop=name]");
            if(obj == null){
                console.log("null item");
                return;
            }
            var target = $(obj).parent();
            $("<div class='rbxrank_group'/>").insertAfter(target);
            var movieHandler = new MovieHandler(target, movie, displayRankingCallback);
            findRanking(movieHandler);
        }
    }
}else{
    $.each( $(".box-wrapper"), function(index, obj){
            var name = $(obj).attr('name');
            //check if the movie is out-of-box 
            $.each( $(obj).children('img'), function(i, img){
                if( $(obj).attr("src").contains("label_out")){
                    console.log("Encountered movie with label_out");
                    return;
                }
            });
            var nname = normalize(name);
            var movieHandler = new MovieHandler(obj, nname);
            movieHandlers.push(movieHandler);
    });

    console.log("scheduling timer 1 sec");
    setTimeout(schedule, 1000);
}
