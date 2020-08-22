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

  // when the start audio button is clicked
  $('#audio_start').on('click', function() {
    // start the audio
    startAudio();
  });

  // when the stop audio button is clicked
  $('#audio_stop').on('click', function() {
    // stop the audio
    stopAudio();
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

var context = new AudioContext();
var soundSource;
var chunks;
var mtrack = 0;
var buf;


/*
var wav_header_array = [0x52, 0x49];
wav_header_view[0] = wav_header_array[0];
wav_header_view[1] = wav_header_array[1];
*/
//wav_header_view = hexToBytes(wav_header_string);


function createWavHeader(byte_length) {
  var wav_header = new ArrayBuffer(44);
  var wav_header_view = new Uint8Array(wav_header);
  var byte_length_hex = (byte_length).toString(16);
  // first 40
  var wav_header_string = '52494646';
  var data_length_hex = (36 + byte_length).toString(16);
  var data_length_hex_string = ('00000000' + data_length_hex).slice(-8);
  wav_header_string += data_length_hex_string;
  wav_header_string += '57415645666d7420100000000100010044ac0000885801000200100064617461';

  var byte_length_hex = (byte_length).toString(16);
  // left pad
  var byte_length_hex_string = ('00000000' + byte_length_hex).slice(-8);
  wav_header_string += byte_length_hex_string;

  var wav_header_bytes = hexToBytes(wav_header_string);
  //console.log(hexToBytes(wav_header_string));

  for (var i = 0; i < 44; i++) {
    wav_header_view[i] = wav_header_bytes[i];
  }

  console.log('byte_length: ' + byte_length);
  console.log('wav_header');
  console.log(wav_header);
  console.log('hexview wav_header');
  console.log(hexview(wav_header));

  return wav_header;
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function appendBuffer(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

function hexview(input) {
  return Array.prototype.map.call(new Uint8Array(input), x => ('00' + x.toString(16)).slice(-2)).join('');
}

// start the audio
function startAudio() {
  // create the message
  var message = { command: 'start_audio' };
  // send the message to start the audio
  App.messaging.send_message(message);


  setTimeout(function() {
  //  createSoundSource(chunks);
  }, 4000);

  var ws = new WebSocket(video_server_url);
  ws.binaryType = "arraybuffer";
  ws.onmessage = function(message) {
    //console.log(mtrack);

    if (mtrack === 0) {
      //var output = appendBuffer(wav_header, message.data);
      //console.log(output);
      console.log('message.data');
      console.log(message.data);
      console.log('hexview message.data');
      console.log(hexview(message.data));
      createSoundSource(message.data);
    } else {
      // set the data size
      var wav_header = createWavHeader(message.data.byteLength);
      var x = appendBuffer(wav_header, message.data);
      //console.log(hexview(x));
      createSoundSource(x);
    }
    mtrack++;
/*
    if (mtrack === 0) {
      console.log(hexview(message.data));
      chunks = message.data;
      //createSoundSource(message.data);
    }
    else if (mtrack < 10000) {

      chunks = appendBuffer(chunks, message.data);
      console.log(chunks);

    } else if (mtrack === 10000) {
      chunks = appendBuffer(chunks, message.data);
      console.log(chunks);
      //createSoundSource(chunks);
    }
    mtrack++;
    */
  }
}

function createSoundSource(audioData) {
        context.decodeAudioData(audioData, function(soundBuffer){
            var soundSource = context.createBufferSource();
            soundSource.buffer = soundBuffer;
            soundSource.connect(context.destination);
            soundSource.start(0);
        });
}

// stop the audio
function stopAudio() {
  // create the message
  var message = { command: 'stop_audio' };
  // send the message to start the audio
  App.messaging.send_message(message);
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
