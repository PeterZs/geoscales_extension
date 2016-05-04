var result;
var lat;
var lon;

chrome.extension.onMessage.addListener( function(message,sender,sendResponse) {
  if(message.stuff == "done")
    $('#wheel').empty();
    //window.close();
});

$(document).ready(function () {

  /**
   * Checks chrome.storage to see if the location is already saved
   * conditionally shows saved location if data exists
   * Automatically calls submitAddress() if data exists when extension is loaded
   * @param  {object} data, object containing data in chrome.storage
   */
  chrome.storage.sync.get(function(data) {
    if(data) {
      if('lon' in data && 'lat' in data && 'location' in data) { //if all data exists in object
         $('#gs_location').text(data.location);
         $('#gs_info').empty().text('Chose a different location that you are familiar with.')
         $('#gs_saved_location').css('display', 'block');

         lat = data.lat;
         lon = data.lon;
      }
    }
    console.log('Your current location is: ' + data.location)
    console.log( 'lon: ' + data.lon + ', lat: ' + data.lat );
    submitAddress(data);
  });

  $("#searchBox").autocomplete({
      source: function (request, response) {
          $.ajax({
              url: "https://dev.virtualearth.net/REST/v1/Locations",
              countryRegion: 'US',
              dataType: "json",
              data: {
                  key: "AhLlK-nI7fJvXr7VViCTVzu6HlhZrkR7G9bsGhe1Ip7aOpsvSRThphl8LL3308KI",
                  q: request.term
              },
              jsonp: "jsonp",

              success: function (data) {
                  result = data.resourceSets[0];
                  console.log(result);
                  if (result) {
                      if (result.estimatedTotal > 0) {
                          response($.map(result.resources, function (item) {
                              if(item.address.countryRegion == 'United States') {
                              return {
                                  data: item,
                                  value: item.name
                              }
                          }
                          }));
                      }
                  }
              }
          });
      },
      minLength: 1
  }); //searchBox autocomplete ready

  /**
   * If autocorrect is chosen or selected, submits address with either 
   * the enter keypress or if the apply button is pressed
   */
  $('#startAtlas').click(function() {
    submitAddress();
  })
  $('#searchBox').keyup(function(e) {
    if(e.keyCode === 13) {// if user hits 'enter'
      submitAddress(); 
    }
  });

  /**
   * Takes the user input and passes it to reference for rest of extension
   * Calls saveAddress() if user checks input-box
   * @param {[object]} data, object containing chrome.storage data, assigns 
   *                         variables is data exists, otherwise listens to autocorrect query
   * @throws {[err]} If user does not use auto-complete or if there is no input 
   */
  function submitAddress(data) {
    try {
        var location;

        if (data) {
          lat = data.lat;
          lon = data.lon;
        } else {
          var $val = $('#searchBox').val();
          var $index;

          // iterate through result object to match the chosen location name
          for(var i = 0; i < result['resources'].length; i++ ) {
            if(result['resources'][i].name === $val) {
              $index = i;
              break;
            }
          }

          lat = result['resources'][$index]['bbox'][0];
          lon = result['resources'][$index]['bbox'][1];
          location = result['resources'][$index].name;
        }

        if($('#gs_save_button').is(':checked')) {
          saveAddress(lat, lon, location); 
        }

        $('#err').empty();
        wheel = chrome.extension.getURL("images/loading.gif")
        $('#wheel').append("<center><img id='loadingWheel' src='images/loading.gif'></center>");
        chrome.tabs.query({active:true,currentWindow:true}, function(tab) {
          chrome.tabs.sendMessage(tab[0].id, {lat:lat,lon:lon});
        });
    }
    catch(err) {
        $('#err').empty();
        $error = $('<h4>', {class: 'error animated fadeInUp', text: "Please use the autocomplete function to enter your address." });
        $('#err').append($error);
    }
  }

  /**
   * Saves the latitude, longitude and location name of the 
   * saved address for users in chrome.storage
   * @param  {[int]}    lat      latitude of location used for plotly chart
   * @param  {[int]}    lon      longitude of location used for plotly chart
   * @param  {[string]} location location by name that appears in auto-complete
   */
  function saveAddress(lat, lon, location) {
    chrome.storage.sync.set({
      'location': location,
      'lat': lat,
      'lon': lon
    }, function() {
      console.log('saved');
    });
  }
}); // doc ready