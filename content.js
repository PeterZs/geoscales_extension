var mapArrayCountry;
var mapArrayCity;
var mapArrayArea;
var mapArrayDistance;
var mapArrayState;
var ixArraylength;
var cityIxArray;
var countrylist;
var statelist;
var myind;
var content;
var final_content;
var lat;
var lon;
var searchBox;

//recieve lat, lon from popup.js
chrome.extension.onMessage.addListener( function(message,sender,sendResponse) {
    lat = message.lat;
    lon = message.lon;
    startAtlas(lat, lon)
});

function startAtlas (lat, lon) {
    lat = lat;
    lon = lon;
    $(document).ready(function() {
        //highlight();
        highlight($('body').text());
    })
}

String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

function getMatches(str, regex) {
    var matches = [];
    var match;
    str = str.replace(/ *\([^)]*\) */g, "");

    if (regex.global) {
        regex.lastIndex = 0;
    } else {
        regex = new RegExp(regex.source, 'g' +
            (regex.ignoreCase ? 'i' : '') +
            (regex.multiline ? 'm' : '') +
            (regex.sticky ? 'y' : ''));
    }
    while (match = regex.exec(str)) {
        // If you want to use regex.lastIndex in this loop, you'd need more
        // code here to fix IE < 9
        matches.push(match);
 
        if (regex.lastIndex === match.index) {
            regex.lastIndex++;
        }
    }
    return matches;
}

function doRequest(url,data,callback) {
    var xmlhttp = new XMLHttpRequest(); // create a new request here
    xmlhttp.open("POST", url, false); // for sync if it is true, async
    xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xmlhttp.onreadystatechange=function() {     
        if (xmlhttp.readyState==4) {
            if (xmlhttp.status == 200) {
                // pass the response to the callback function
                callback(null, xmlhttp.responseText);
            } else {
                // pass the error to the callback function
                callback(xmlhttp.statusText);
            }
        }
    }
    xmlhttp.send(data);
}

function highlight(article_content) {
        myind = 0;
        content = article_content;
//	content = $('body').text();
//	console.log("content: "+content);
	//convert expressions 3 million to numeric equivalent so that if they are distance or area they get tagged
        var myRegexpMega = /[\s]*([1-9][0-9]{0,2})[\s-]*(?:billion|million|thousand|trillion)[\s]*/g;   
        var myRegexThous = /thousand/;
        var myRegexMil = /million/;
        var myRegexBil = /billion/;
        var myRegexTril = /trillion/;
        var bilmatches;
        bilmatches = getMatches(content, myRegexpMega);
        for (var i = 0; i < bilmatches.length; i++) {
        //              console.log("bilmatch0: "+bilmatches[i][0]+" bilmatch1: "+bilmatches[i][1]);
                //      bilmatches[i][0] = bilmatches[i][0].replace(re, '');
                //      bilmatches[i][1] = bilmatches[i][1].replace(re, '');
                var mre = new RegExp(bilmatches[i][0], "g");
                var matchThous = myRegexThous.exec(bilmatches[i][0]);
                var matchMil = myRegexMil.exec(bilmatches[i][0]);
                var matchBil = myRegexBil.exec(bilmatches[i][0]);
                var matchTril = myRegexTril.exec(bilmatches[i][0]);
                if(matchThous!=null) {
                        content= content.replace(mre, " "+bilmatches[i][1]+",000 ");
                }
                if(matchMil!=null) {
                        content= content.replace(mre, " "+bilmatches[i][1]+",000,000 ");
                }
                if(matchBil!=null) {
                       //myString = myString.replace(mre, " <<<"+bilmatches[i][1]+",000,000,000>>> ");
                        content= content.replace(mre, " "+bilmatches[i][1]+",000,000,000 ");
                }
                if(matchTril!=null) {
                       //myString = myString.replace(mre, " <<<"+bilmatches[i][1]+",000,000,000,000>>> ");
                        content= content.replace(mre, " "+bilmatches[i][1]+",000,000,000,000 ");
                }
       }
//	$('body').text(content);
	article_content = content;

	var locationObj = {"location":[lat, lon]};
	var areaMatch;
	var distanceMatch;
	var countryMatch = [];
    var stateMatch = [];
    var resultArea={};
    var resultDistance={};
    var resultCountry={};
    var sendToApi = {};
    //var myAreaRegexp = /([1-9](?:\d{0,2})(?:,\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9]|0)[\s-]*((?:acre[\s-]*foot|acre[\s-]*feet|acres?|acre?|square[\s-]miles?|square[\s-]yards?|square[\s-]meters?|square[\s-]metres?|square[\s-]ft|square[\s-]feet|square[\s-]foot|ft^2|m\^2))/g;
//currently the superscript 2 expressions are not working
      var myAreaRegexp = /([1-9](?:\d{0,2})(?:,\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9]|0)[\s-]*((?:acre[\s-]*foot|acre[\s-]*feet|acres?|acre?|square[\s-]miles?|square[\s-]yards?|square[\s-]meters?|square[\s-]metres?|square[\s-]ft|square[\s-]feet|square[\s-]foot|ft^2|m\^2|ft\<sup>2<\/sup>|m<sup>2<\/sup>|km\<sup>2<\/sup>|km2|mi2|mi<sup>2<\/sup>))/g;
    //  var myAreaRegexp = /([1-9](?:\d{0,2})(?:,\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9]|0)[\s-]*((?:acre[\s-]*foot|acre[\s-]*feet|acres?|acre?|square[\s-]miles?|square[\s-]yards?|square[\s-]meters?|square[\s-]metres?|square[\s-]ft|square[\s-]feet|square[\s-]foot|ft^2|m\^2|ft<sup>2|m<sup>2|km<sup>2|km2|mi2|mi<sup>2))/g;
    var myDistanceRegexp = /([1-9](?:\d{0,2})(?:,\d{3})*(?:\.\d*[1-9])?|0?\.\d*[1-9]|0)[\s-]*((?:yd|yards?|\bfoot|\bfeet|mi[\s-]|MI[\s-]|Mi[\s-]|meters?|meter?|miles?|mile|Miles?|Mile?|metres?|kilometers?|km|mi\b|miles?))/g;
        var myCountryRegexp = /Andorra|United Arab Emirates|Afghanistan|Antigua and Barbuda|Anguilla|Albania|American Samoa|Austria|Aruba|Bosnia|Barbados|Belgium|Burkina Faso|Bulgaria|Bahrain|Burundi|Benin|Bermuda|Bolivia|Bhutan|Bouvet Island|Botswana|Belarus|Belize|Cocos Islands|Central African Republic|Congo|Switzerland|Cook Islands|Cameroon|Colombia|Costa Rica|Christmas Island|Cyprus|Czech Republic|Djibouti|Dominica|Dominican Republic|Algeria|Egypt|Western Sahara|Ethiopia|Micronesia|Gabon|Grenada|Georgia|French Guiana|Ghana|Gibraltar|Gambia|Guinea|Guadeloupe|South Georgia and the South Sandwich Islands|Guatemala|Guam|Guinea-Bissau|Guyana|Heard Island and McDonald Islands|Honduras|Hungary|Ireland|Israel|Syria|Swaziland|Turks and Caicos Islands|Chad|Togo|Tajikistan|Tokelau|Turkmenistan|Tonga|Trinidad and Tobago|Tuvalu|Ukraine|Uganda|Uruguay|Uzbekistan|Saint Vincent and the Grenadines|Virgin Islands|Wallis and Futuna|Mayotte|Zambia|Zimbabwe|British Indian Ocean Territory|Iraq|Iceland|Jamaica|Jordan|Kenya|Kyrgyzstan|Cambodia|Kiribati|Saint Kitts and Nevis|North Korea|Cayman Islands|Kazakhstan|Lebanon|Saint Lucia|Liechtenstein|Sri Lanka|Liberia|Lesotho|Luxembourg|Latvia|Libya|Morocco|Monaco|Moldova|Montenegro|Madagascar|Marshall Islands|Macedonia|Mali|Mongolia|Northern Mariana Islands|Martinique|Mauritania|Montserrat|Malta|Mauritius|Maldives|Mozambique|Namibia|Niger|Norfolk Island|Nigeria|Nicaragua|Nepal|Nauru|Niue|Peru|French Polynesia|Pakistan|Poland|Saint Pierre and Miquelon|Pitcairn Islands|Puerto Rico|Palau|Paraguay|Qatar|Romania|Serbia|Rwanda|Seychelles|Sudan|Singapore|Saint Helena|Slovenia|Slovakia|San Marino|Senegal|Somalia|Suriname|Sao Tome and Principe|El Salvador|Armenia|Angola|Argentina|Australia|Azerbaijan|Bangladesh|Brunei|Brazil|Bahamas|Canada|Ivory Coast|Chile|China|Cuba|Cape Verde|Germany|Denmark|Ecuador|Estonia|Eritrea|Spain|Finland|Fiji|Falkland Islands|Faroe Islands|France|United Kingdom|Greenland|Equatorial Guinea|Greece|Croatia|Haiti|Indonesia|India|Thailand|Timor-Leste|Tunisia|Turkey|Tanzania|United States|Venezuela|Vietnam|Vanuatu|Samoa|Yemen|South Africa|Iran|Italy|Japan|Comoros|South Korea|Kuwait|Lithuania|Myanmar|Malawi|Mexico|Malaysia|New Caledonia|Netherlands|Norway|New Zealand|Oman|Panama|Papua New Guinea|Philippines|Portugal|Russia|Saudi Arabia|Solomon Islands|Sweden|Jan Mayen|Sierra Leone|U.S.|Taiwan/g;
    
    areaMatch = getMatches(article_content, myAreaRegexp)
    distanceMatch = getMatches(article_content, myDistanceRegexp);
    countryMatch = getMatches(article_content, myCountryRegexp);

    var areaMatchOjb = {"area": areaMatch};
    var distanceMatchOjb = {"distance": distanceMatch};
    var countryMatchOjb = {"country":countryMatch};
    var stateOjb = {"state":stateMatch};

    for(var key in areaMatchOjb) resultArea[key]=areaMatchOjb[key];
    for(var key in distanceMatchOjb) resultDistance[key]=distanceMatchOjb[key];
    for(var key in countryMatchOjb) resultCountry[key]=countryMatchOjb[key];

    
    sendToApi = {locationObj,countryMatchOjb,areaMatchOjb,distanceMatchOjb,stateOjb}
	var urimerge = "http://visualization.ischool.uw.edu:5000/todo/api/v1.0/merge/";
	doRequest(urimerge, JSON.stringify(sendToApi), function(err, response) { 
        if (err) {
            console.log('Error: ' + err);
        } else {
            responseArray = JSON.parse(response);
            final_content = $('body').html();

		//convert the final content to the part that was run through tagger -- which first
		//changed regex like 11 thousand|million etc to numeric equivalent 
	      for (var i = 0; i < bilmatches.length; i++) {
        //              console.log("bilmatch0: "+bilmatches[i][0]+" bilmatch1: "+bilmatches[i][1]);
                //      bilmatches[i][0] = bilmatches[i][0].replace(re, '');
                //      bilmatches[i][1] = bilmatches[i][1].replace(re, '');
                var mre = new RegExp(bilmatches[i][0], "g");
                var matchThous = myRegexThous.exec(bilmatches[i][0]);
                var matchMil = myRegexMil.exec(bilmatches[i][0]);
                var matchBil = myRegexBil.exec(bilmatches[i][0]);
                var matchTril = myRegexTril.exec(bilmatches[i][0]);
                if(matchThous!=null) {
                        final_content= final_content.replace(mre, " "+bilmatches[i][1]+",000 ");
                }
                if(matchMil!=null) {
                        final_content= final_content.replace(mre, " "+bilmatches[i][1]+",000,000 ");
                }
                if(matchBil!=null) {
                       //myString = myString.replace(mre, " <<<"+bilmatches[i][1]+",000,000,000>>> ");
                        final_content= final_content.replace(mre, " "+bilmatches[i][1]+",000,000,000 ");
                }
                if(matchTril!=null) {
                       //myString = myString.replace(mre, " <<<"+bilmatches[i][1]+",000,000,000,000>>> ");
                        final_content= final_content.replace(mre, " "+bilmatches[i][1]+",000,000,000,000 ");
                }
            }

	    
            // console.log('finalcontent',final_content);

        	// for creating map later
        	mapArrayState = new Array();
            mapArrayCountry = new Array();
        	mapArrayArea = new Array();
        	mapArrayDistance = new Array();
        	//to compare with city list later
        	countrylist = [];
            statelist = [];

        	countryResult = responseArray["result"]["country"]["country"]
            stateResult = responseArray["result"]["state"]["state"]
        	areaResult = responseArray["result"]["area"]
        	distanceResult = responseArray["result"]["distance"]
        	var myindCountry = 0;
            $.each(countryResult, function(key, value) {
                var countryName = key;
                countrylist.push(countryName);
                matchObject = value[0][0];  
                matchMult = value[0][1];
                center_lat = value[0][2];
                center_lon = value[0][3];
                userarea = value[0][4];
                this_country_lat = value[0][5];
                this_country_lon = value[0][6];
                this_country_area = value[0][7];
                this_country_polygon = value[0][8];
                topoid =  value[0][9];
                mapArrayCountry[countryName] = [matchObject, center_lat, center_lon, userarea, this_country_lat,this_country_lon,this_country_area,this_country_polygon,countryName,topoid,countryName,matchMult];
                console.log('countryName',countryName);
                final_content = final_content.replaceAll(" " +countryName," <span class='measure-atlas country-atlas' id='my-tooltip-country-"+countryName+"\'>" +countryName + '</span>');
                myind += 1;
                myindCountry += 1;
             });
            console.log("mapArrayCountry",mapArrayCountry);

             var myindArea = 0;
        	 for (var i = 0; i < areaResult.length; i++) {
                matchKeyword = areaResult[i][0][0];
                matchObject = areaResult[i][0][1];
                matchMult = areaResult[i][0][3];
                polygon = areaResult[i][0][5];
                object_city = areaResult[i][0][6];
                object_state = areaResult[i][0][7];
                mapArrayArea[myindArea] = [polygon, matchObject,matchKeyword,matchMult, object_city, object_state];

                // final_content = final_content.replaceAll(" " +matchKeyword + " ",' <span class="measure area" id="m'+myindArea.toString() + '">' + matchKeyword + " " +"</span>");
                // final_content = final_content.replaceAll(" " +matchKeyword, " <span class='measure-atlas'>" + matchKeyword + '</span> [<b>'+matchKeyword + '</b> is about ' + String(Math.round(parseFloat(matchMult)*1000)/1000) + ' times bigger than ' +  matchObject + '</b> in <b> ' + object_city + ', ' + object_state + '</b>] ');
                final_content = final_content.replaceAll(" " +matchKeyword," <span class='measure-atlas area-atlas' id='my-tooltip-area-"+myindArea+"\'>" +matchKeyword+'</span>');
                myind += 1;
                myindArea += 1;
            }
            console.log("mapArrayArea",mapArrayArea);

            // final.append([keyword, name, dist, mult,this_coord,this_city,mystate])
            var myindDistance = 0;
            for (var i = 0; i < distanceResult.length; i++) {
                matchKeyword = distanceResult[i][0][0];
                matchObject = distanceResult[i][0][1];
                matchMult = distanceResult[i][0][3];
                this_coord = distanceResult[i][0][4];
                object_city = distanceResult[i][0][5];
                object_state = distanceResult[i][0][6];
                mapArrayDistance[myindDistance] = [this_coord,matchObject,matchKeyword,matchMult,object_city, object_state];
                console.log("distancematchkeyword:",matchKeyword);
                // final_content = final_content.replaceAll(" " +matchKeyword + " ",' <span class="measure distance" id="m'+myindDistance.toString() + '"><a href="#/" data-toggle="tooltip" title="' + matchKeyword + ' is ' + String(Math.round(parseFloat(matchMult)*1000)/1000) + ' times longer than the distance between you and ' + matchObject + '">'+" " + matchKeyword + " " +"</span></a>");
                // tootip_content = '<a href="#/" data-toggle="tooltip" title="<img src="http:\/\/pix.epodunk.com/locatorMaps/wa/WA_24992.gif">"' + matchKeyword + " " +"</span></a>"
                // final_content = final_content.replaceAll(" " +matchKeyword + " ",' <span class="measure distance" id="m'+myindDistance.toString() + '">");
                // final_content = final_content.replaceAll(" " +matchKeyword," <span class='measure-atlas' id='my-tooltip'>" +matchKeyword+'</span> [<b>'+matchKeyword + '</b> is about ' + String(Math.round(parseFloat(matchMult)*1000)/1000) + ' times longer than the distance between <b>you</b> and <b>' + matchObject + '</b> in <b> ' + object_city + ', ' + object_state + '</b>] '); //  previous version with injected text 
                final_content = final_content.replaceAll(" " +matchKeyword," <span class='measure-atlas distance-atlas' id='my-tooltip-distance-"+myindDistance+"\'>" +matchKeyword+'</span>');
                myind += 1;
                myindDistance += 1;
            }
            console.log("mapArrayDistance",mapArrayDistance);   
            $('body').html(final_content);
            
            
        } //else end
    }) //doRequest end
// $('#loadingLayer-altas').css("background-color",rgba(255,255,255,0));
console.log($('#loadingLayer-altas').remove())
create_tooltip(); 
} // highlight end



function create_tooltip() {
    $.each($('.distance-atlas'), function(i,d) {
        key = this.id.split("-")[this.id.split("-").length-1];
        $(this).tooltipster({
            theme: 'tooltipster-noir',
            content: $("<div class='tootip_outer'><div id='exp'>"+'<b>'+mapArrayDistance[key][2] + '</b> is about <b>' + mapArrayDistance[key][3] + '</b> times longer than the distance between <b>you</b> and <b>' + mapArrayDistance[key][1] + '</b> in <b> ' + mapArrayDistance[key][4] + ', ' + mapArrayDistance[key][5] + '</b>'+"</div><br><div id='personalizedmap'></div></div>"),
            minWidth:340,
            maxWidth:350,
            'trigger':'click',
            functionReady: function(origin, tooltip) { key = origin[0].id.split("-")[origin[0].id.split("-").length-1]; showDistanceMap(lat,lon,mapArrayDistance[key][0][0],mapArrayDistance[key][0][1],mapArrayDistance[key][1],mapArrayDistance[key][3])},
            functionAfter: function(origin) {distancemap.remove()}
        });
    });

    $.each($('.area-atlas'), function(i,d) {
        key = this.id.split("-")[this.id.split("-").length-1];
        if (mapArrayArea[key][4] != "NA") {
            tooltip_content_area = "<div class='tootip_outer'><div id='exp'>"+'<b>'+mapArrayArea[key][2] + '</b> is about ' + mapArrayArea[key][3] + ' times bigger than <b>' + mapArrayArea[key][1] + '</b> in <b> ' + mapArrayArea[key][4] + ', ' + mapArrayArea[key][5] + '</b>'+"</div><br><div id='personalizedmap'></div></div>";
        } else {
            tooltip_content_area = "<div class='tootip_outer'><div id='exp'>"+'<b>'+mapArrayArea[key][2] + '</b> is about ' + mapArrayArea[key][3] + ' times bigger than <b>' + mapArrayArea[key][1] + ' state.' + "</div><br><div id='personalizedmap'></div></div>";
        }
        $(this).tooltipster({
            theme: 'tooltipster-noir',
            content: $(tooltip_content_area),
            minWidth:340,
            maxWidth:350,
            'trigger':'click',
            functionReady: function(origin, tooltip) { key = origin[0].id.split("-")[origin[0].id.split("-").length-1]; showAreaMap(lat,lon,mapArrayArea[key][0][0],mapArrayArea[key][1])},
            functionAfter: function(origin) {areamap.remove()}
        });

    });


    $.each($('.country-atlas'), function(i,d) {
        key = this.id.split("-")[this.id.split("-").length-1];
        matchObject = mapArrayCountry[key][0];
        center_lat = parseFloat(mapArrayCountry[key][1]);
        center_lon = parseFloat(mapArrayCountry[key][2]);
        userarea = mapArrayCountry[key][3];
        this_country_lat = parseFloat(mapArrayCountry[key][4]);
        this_country_lon = parseFloat(mapArrayCountry[key][5]);
        this_country_area = mapArrayCountry[key][6];
        contour = mapArrayCountry[key][7];
        topoid = mapArrayCountry[key][9];
        keyword = mapArrayCountry[key][10];
        this_mult = mapArrayCountry[key][11];
        if (mapArrayCountry[key][8] == 'United States') {
            tooltip_content = "<div class='tootip_outer'><div id='exp'>"+'<b>'+ mapArrayCountry[key][8] + "</b> is your country.</div><br><div id='large'></div></div>";
        } else {
            tooltip_content = "<div class='tootip_outer'><div id='exp'>"+'<b>'+ mapArrayCountry[key][8] + '</b> is about <b>' + mapArrayCountry[key][11] + '</b> times bigger than your <b>' + mapArrayCountry[key][0]+ "</b></div><br><div id='large'></div></div>";
        }
        $(this).tooltipster({
            theme: 'tooltipster-noir',
            content: $(tooltip_content),
            minWidth:340,
            maxWidth:350,
            'trigger':'click',
            functionReady: function(origin, tooltip) { key=origin[0].id.split("-")[origin[0].id.split("-").length-1]; drawfromarticle(mapArrayCountry[key][0], parseFloat(mapArrayCountry[key][1]) ,parseFloat(mapArrayCountry[key][2]), mapArrayCountry[key][3], parseFloat(mapArrayCountry[key][4]), parseFloat(mapArrayCountry[key][5]), mapArrayCountry[key][6], 100, mapArrayCountry[key][9],'') },
            // functionReady: function(origin, tooltip) { console.log(); drawfromarticle(key) },
            functionAfter: function(origin) { $('#large').empty()}
         });
    });
   chrome.extension.sendMessage({stuff:"done"},function(reponse){
    // send msg to the popup.js "done"
    });


} //create_tooltip end


function showDistanceMap(lat, lon, this_lat, this_lon,place,this_mult){
    try {
        distancemap = L.map('personalizedmap');
    } catch (e) {distancemap = distancemap}
    distancemap.setView([(lat+this_lat)/2,(lon+this_lon)/2],11);
        var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
        layer.addTo(distancemap);
        var m = L.marker([lat, lon], {draggable:true}).bindLabel('You', { noHide: true,className: "maplabel" })
            .addTo(distancemap)
            .showLabel();

        var m2 = L.marker([this_lat, this_lon], {draggable:true}).bindLabel(place, { noHide: true })
            .addTo(distancemap)
            .showLabel();
        
         var polygon = L.polygon(
                [[lat,lon],[this_lat,this_lon]], {
                color:'#736440'
              });
              polygon.bindLabel("The distance between the two cities is  " + this_mult + " times longer than the distance between you and " + place, { noHide: true }).addTo(distancemap);
        
          var group = new L.featureGroup([m, m2]);
        distancemap.fitBounds(group.getBounds().pad(1)); 
}


function showAreaMap(lat, lon, contour ,place){
    try {
        areamap = L.map('personalizedmap');
    } catch (e) {areamap = areamap}
    areamap.setView([lat, lon],6);
    var tempC = contour.split("],[");
    var tempLat;
    var tempLon;
    var polyArray = [];
    for (var i = 0; i < tempC.length; i++) {
        var latlon = tempC[i].replace("\"",'').replace("[",'').replace("]",'').split(",");
        tempLat = parseFloat(latlon[0]);
        tempLon = parseFloat(latlon[1]);
        var temparray = [tempLat,tempLon];
        polyArray.push(temparray);
        // console.log(tempLat,tempLon);
    }
    // map.setView([(lat+this_lat)/2,(lon+this_lon)/2],11);
    var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
    layer.addTo(areamap);
    // var m = L.marker([lat, lon], {draggable:true}).bindLabel('You', { noHide: true,className: "maplabel" })
    //     .addTo(map)
    //     .showLabel();
     var polygon = L.polygon(
            [polyArray], {
            color:'red', weight:'1px'
          });
    polygon.addTo(areamap).bindLabel(place, { noHide: true,className: "maplabel" });
    var group = new L.featureGroup([polygon]);
    areamap.fitBounds(group.getBounds()); 

}

var 
  largeWidth = 326,
  largeHeight = 326;
var padding = 5;
var transitionDuration = 800;
var largeCanvasContext;
var largeCanvasObj;
var mapObjects = []
var largeMapObjects = []

// to hold land and border data
var land;
var borders;
var stateborder;
var basemap;
var targetmap;
var baseid;
var targetid;
    var zoomToBoxScale = d3.scale.log().domain([17098242, 50]).range([100,600]);
// land colors
var colors = ["#EEEAE2", "#FFD300"]


// define state, with default values
var state = {
  scale: 700,
  area : 500000,
  latLon: [{
    lat: 6.52865,
    lon: 20.3586336
  }, {
    lat: 48.2392291,
    lon: -98.9443219
  }]
}

function drawfromarticle(matchObject, center_lat,center_lon, userarea, this_country_lat, this_country_lon, this_country_area, scale,topoid,topoidState) {
    var zoomRange = [100, 800]
    // define canvas object and context for large canvas
    $('#large').empty();
    largeCanvasObj = d3.select("#large").append("canvas")
      .attr("width", largeWidth)
      .attr("height", largeHeight)

    largeCanvasContext = largeCanvasObj.node().getContext("2d")
    largeCanvasContext.globalAlpha = .9

// var graticule = d3.geo.graticule()()

    // set up ranges/scales

    for (var i = 0; i < 2; i++) {
      largeMapObjects[i] = setUpLargeMaps(state.latLon[i].lat, state.latLon[i].lon, i)
    }


  topoidState = 53073;
  console.log(matchObject, center_lat,center_lon, userarea, this_country_lat, this_country_lon, this_country_area, scale);
  state.latLon[0] = {
          lat: center_lat,
          lon: center_lon
      }
  state.latLon[1] = {
        lat: this_country_lat,
        lon: this_country_lon
    }

  if (topoid != '') {
       d3.json(chrome.extension.getURL("topofile/us.json"), function(error, world) {
      stateborder = topojson.feature(world, world.objects.states);  
      })

    d3.json(chrome.extension.getURL("topofile/world-110m.json"), function(error, world) {
      // land = topojson.feature(world, world.objects.land);
      // borders = topojson.mesh(world, world.objects.countries);
      baseid = d3.set([840]);
      if (topoid == 156) {
        baseid = d3.set([643]);
      }
      console.log(topoid);
      targetid = d3.set([topoid]);
      console.log(baseid,targetid);
      basemap = topojson.merge(world, world.objects.countries.geometries.filter(function(d) { return baseid.has(d.id); }));
      targetmap = topojson.merge(world, world.objects.countries.geometries.filter(function(d) { return targetid.has(d.id); }));
      
      largeCanvasContext.clearRect(0, 0, largeWidth, largeHeight);
      largeCanvasContext.strokeStyle = "#333", largeCanvasContext.lineWidth = 1, largeCanvasContext.strokeRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);
      largeCanvasContext.fillStyle = "#b2d0d0", largeCanvasContext.fillRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);

      largeCanvasContext.fillStyle = colors[0], largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.fill();
      largeCanvasContext.strokeStyle = "black", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.stroke();
      largeCanvasContext.fillStyle = colors[1], largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.fill();
      largeCanvasContext.strokeStyle = "#4C3100", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.stroke();
      largeCanvasContext.strokeStyle = "gray", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(stateborder), largeCanvasContext.stroke();

    })
  } else {
     d3.json("us.json", function(error, world) {
      baseid = d3.set([840]);
      console.log(topoidState);
      targetid = d3.set([topoidState]);
      basemap = topojson.merge(world, world.objects.counties.geometries.filter(function(d) { return baseid.has(d.id); }));
      targetmap = topojson.merge(world, world.objects.counties.geometries.filter(function(d) { return targetid.has(d.id); }));
      largeCanvasContext.clearRect(0, 0, largeWidth, largeHeight);
      largeCanvasContext.strokeStyle = "#333", largeCanvasContext.lineWidth = 1, largeCanvasContext.strokeRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);
      largeCanvasContext.fillStyle = "#b2d0d0", largeCanvasContext.fillRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);

      largeCanvasContext.fillStyle = colors[0], largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.fill();
      largeCanvasContext.strokeStyle = "black", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.stroke();
      largeCanvasContext.fillStyle = colors[1], largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.fill();
      largeCanvasContext.strokeStyle = "#4C3100", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.stroke();
      largeCanvasContext.strokeStyle = "gray", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(stateborder), largeCanvasContext.stroke();
      })
  }

  state.scale = this_country_area;
  rotateAndScale()
  updateHash()

}



function setUpLargeMaps(lat, lon, name) {
  var projectionLarge = d3.geo.azimuthalEqualArea()
    .translate([largeWidth / 2, largeHeight / 2])
    // .scale(state.scale)
    .scale(state.scale)
    .center([0, 0])
    .clipAngle(180 - 1e-3)
    .clipExtent([
      [2 * padding, 2 * padding],
      [largeWidth - 2 * padding, largeHeight - 2 * padding]
    ])
    .rotate([-lon, -lat])
    .precision(.7);

  var path = d3.geo.path()
    .projection(projectionLarge)
    .context(largeCanvasContext);

  largeCanvasObj.call(dragSetupLarge())

  return {
    "projection": projectionLarge,
    "path": path,
  }
}

// what to draw on the canvas for large/small
var drawCanvasLarge = function() {
  largeCanvasContext.clearRect(0, 0, largeWidth, largeHeight);
  largeCanvasContext.strokeStyle = "#333", largeCanvasContext.lineWidth = 1, largeCanvasContext.strokeRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);
  largeCanvasContext.fillStyle = "#b2d0d0", largeCanvasContext.fillRect(2 * padding, 2 * padding, largeWidth - 4 * padding, largeHeight - 4 * padding);

  largeCanvasContext.fillStyle = colors[0], largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.fill();
  largeCanvasContext.strokeStyle = "black", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(basemap), largeCanvasContext.stroke();
  largeCanvasContext.fillStyle = colors[1], largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.fill();
  largeCanvasContext.strokeStyle = "#4C3100", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[1].path(targetmap), largeCanvasContext.stroke();
  largeCanvasContext.strokeStyle = "gray", largeCanvasContext.lineWidth = .5, largeCanvasContext.beginPath(), largeMapObjects[0].path(stateborder), largeCanvasContext.stroke();
  
}

var topoid;


// update large & small smallContext, based on update function (either rotationAndScaleTween or rotationTween)
function rotateAndScale() {
  (function transition() {
    d3.select("#large").select("canvas")
      .transition()
      .duration(transitionDuration)
      .tween("d", rotationAndScaleTween)
  })()
}



function rotationAndScaleTween() {
  var r1 = d3.interpolate(largeMapObjects[0].projection.rotate(), [-state.latLon[0].lon, -state.latLon[0].lat]);
  var r2 = d3.interpolate(largeMapObjects[1].projection.rotate(), [-state.latLon[1].lon, -state.latLon[1].lat]);
  // var interpolateScale = d3.interpolate(largeMapObjects[0].projection.scale(), state.scale);
  var interpolateScale = d3.interpolate(zoomToBoxScale(largeMapObjects[0].projection.scale()), zoomToBoxScale(largeMapObjects[1].projection.scale()))

  return function(t) {
    // update rotation
    largeMapObjects[0].projection.rotate(r1(t));
    largeMapObjects[1].projection.rotate(r2(t));

    // update scale
    largeMapObjects[0].projection.scale(interpolateScale(t));
    largeMapObjects[1].projection.scale(interpolateScale(t));

    drawCanvasLarge()
  };
}

// update functions
var updateHash = function() {
  // window.location.hash = "scale=" + state.scale + "&center0=" + state.latLon[0].lat + "," + state.latLon[0].lon + "&center1=" + state.latLon[1].lat + "," + state.latLon[1].lon;
  // slider.property("value", state.scale)
}

// DRAG
function dragSetupSmall(name) {
  function resetDrag() {
    dragDistance = {
      x: 0,
      y: 0
    };
  }

  var dragDistance = {
    x: 0,
    y: 0
  };

  return d3.behavior.drag()
    .on("dragstart", function() {
      d3.event.sourceEvent.preventDefault();
    })
    .on("drag", function() {
      dragDistance.x = dragDistance.x + d3.event.dx;
      dragDistance.y = dragDistance.y + d3.event.dy;
      resetDrag()
    })
    .on("dragend", function() {
      resetDrag()
    })
}

function dragSetupLarge() {

  function resetDrag() {
    dragDistance = {
      x: 0,
      y: 0
    };
  }

  var dragDistance = {
    x: 0,
    y: 0
  };

  return d3.behavior.drag()
    .on("dragstart", function() {
      d3.event.sourceEvent.preventDefault();
    })
    .on("drag", function() {
      dragDistance.x = dragDistance.x + d3.event.dx;
      dragDistance.y = dragDistance.y + d3.event.dy;
      updateRotateFromLargeDrag(dragDistance)
      resetDrag()
    })
    .on("dragend", function() {
      updateRotateFromLargeDrag(dragDistance)
      resetDrag()
    });
}


function updateRotateFromLargeDrag(pixelDifference) {
  var newRotate0 = pixelDiff_to_rotation_large(largeMapObjects[0].projection, pixelDifference)
  var newRotate1 = pixelDiff_to_rotation_large(largeMapObjects[1].projection, pixelDifference)

  // set new rotate
  // mapObjects[0].projection.rotate(newRotate0)
  // mapObjects[1].projection.rotate(newRotate1)
  largeMapObjects[0].projection.rotate(newRotate0)
  largeMapObjects[1].projection.rotate(newRotate1)
  updateStateRotation(newRotate0, 0)
  updateStateRotation(newRotate1, 1)

  updateRotationFromLargePan(name)
}

function updateRotationFromLargePan() {
  drawCanvasLarge()
}
