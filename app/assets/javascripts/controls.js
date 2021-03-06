// keep track of the start transmission time
var start_transmission_time = 0;
// keep track of the video player
var video_player = null;
// keep track of the video timeout
var video_timeout = null;
// keep track of whether the video is currently playing
var video_active = false;

// when the document is ready
$(document).ready(function() {

  // when the power off button is clicked
  $('#device-off').on('click', function() {
    // if confirmed
    if (confirm('Are you sure you want to shut down?')) {
      // create the message
      var message = { command: 'shutdown' };
      // send the message to shut down
      App.messaging.send_message(message);
    }
  });

  // when user activity is detected
  $('body').on('mousemove mousedown touchstart touchmove', function() {
    // only detect activity if video has been played
    if (video_active === true) { activityDetected(); }
  });

  // when the start video button is clicked
  $('#video_start').on('click', function() {
    // start the video
    startVideo();
  });

  // when the stop video button is clicked
  $('#video_stop').on('click', function() {
    // stop the video
    stopVideo();
  });

  // when the embed code button is clicked
  $('#video_embed_button').on('click', function() {
    // show the embed code
    $('#embed_code_div').removeClass('hidden');
    // hide the button
    $(this).addClass('hidden');
  });

  // when the digital on/off button is clicked
  $('.digital_submit').on('click', function() {
    // remove active class
    $('.pin_' + $(this).data('pin') + '_buttons').removeClass('active');
    // blur the button to make it unfocused
    $('.pin_' + $(this).data('pin') + '_buttons').blur();
    // create the message
    var message = { i2c_address: device_i2c_address, pin: $(this).data('pin'), digital: $(this).data('digital') };
    // send the message
    App.messaging.send_message(message);
  });

  // when an 'execute synchronization' button is clicked
  $('.execute-synchronization').on('click', function() {
    // create the message
    var message = { synchronization_id: $(this).data('id') };
    // send the message
    App.messaging.send_message(message);
  });

  // create the subscription
  App.messaging = App.cable.subscriptions.create(
    {
      channel: 'DevicesChannel',
      id: device_id,
      auth_token: device_auth_token
    },
    {

      // when data is received
      received: function(data) {
        // log the data
        logData(data);
      },

      // function to send a message
      send_message: function(message) {
        // mark the start time
        start_transmission_time = (new Date).getTime();

        // perform the "receive" action in app/channels/devices_channel.rb
        this.perform('receive', message);
      }

    }
  );

});

// send servo position
function sendServoMessage(message) {
  // send the message
  App.messaging.send_message(message);
}

// send a synchronization message by id
function sendSynchronization(synchronization_id) {
  // create the message
  var message = { synchronization_id: synchronization_id };
  // send the message
  App.messaging.send_message(message);
}

// send an opposite synchronization message by id
function sendOppositeSynchronization(synchronization_id) {
  // create the message
  var message = { synchronization_id: synchronization_id, opposite: 'true' };
  // send the message
  App.messaging.send_message(message);
}

// start the video
function startVideo() {
  // mark the video as started
  video_active = true;
  // hide the button
  $('#video_start').addClass('hidden');
  // show the canvas
  $('#video_canvas').removeClass('hidden');
  // create the message
  var message = { command: 'start_video' };
  // send the message to start the video
  App.messaging.send_message(message);
  // load the video
  video_player = new JSMpeg.Player(video_server_url, {canvas: $('#video_canvas')[0]});
  // show the stop button
  $('#video_stop').removeClass('hidden');
  // show the embed button
  $('#video_embed_button').removeClass('hidden');
}

// stop the video
function stopVideo() {
  // mark the video as stopped
  video_active = false;
  // hide the video stop button
  $('#video_stop').addClass('hidden');
  // hide the embed button
  $('#video_embed_button').addClass('hidden');
  // hide the embed code
  $('#embed_code_div').addClass('hidden');
  // hide the canvas
  $('#video_canvas').addClass('hidden');
  // disconnect the video
  video_player.destroy();
  // show the start button
  $('#video_start').removeClass('hidden');
}

// new user activity is detected
function activityDetected() {
  // clear the current timeout
  clearTimeout(video_timeout);

  // set new timeout for 10 minutes
  video_timeout = setTimeout(function() {
    // stop video
    stopVideo();
  }, 600000);
}
