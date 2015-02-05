var http = require('http');
var timers = require('timers');
var sys = require('sys');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var procRecord;


var _ip = "127.0.0.1";
var _uname = "";
var _pwd = "";

var wasAlarm = false;
var isRecording = false;
var _alarmBuffer = 0;

var _alarmSound = 0;
var _alarmMotion = 1;

var alarmType = [
    "No",
    "Motion",
    "Input",
    "Sound"
];


function api_setAlarm(cb) {
    // set_alarm.cgi
    http.get("http://" + _ip + "/set_alarm.cgi" +
            "?user=" + _uname +
            "&pwd=" + _pwd + 
            "&motion_armed=" + _alarmMotion + 
            "&motion_sensitivity=0" +
            "&motion_compensation=1" +
            "&sounddetect_armed=" + + _alarmSound + 
            "&sounddetect_sensitivity=0" +
            "&mail=0" +
            "&schedule_enable=0", function(res) {
        // Load the data in chunks
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        
        res.on('end', function() {
            console.log("setAlarm() reply: " + body);
            cb();
        });
    });
};

function api_getStatus(cb) {
    // get_status.cgi
    http.get("http://" + _ip + "/get_status.cgi" + 
            "?user=" + _uname +
            "&pwd=" + _pwd, function(res) {
        // Load the data in chunks
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        
        res.on('end', function() {
            if ( body.indexOf('401 Unauthorized') >= 0 ) {
                console.log("ERROR: Invalid credentials provided");
                cb(null);
                return;
            }
            
            /* Super-duper insecure. Just FYI
             * This basically changes the javascript variables
             * that are returned into part of a JSON object called
             * 'trick'. Using eval we can populate that object
             * and work with the data in a sane way. */
            var trick = {};
            eval(body.replace(/var /g, 'trick.'));
            
            // In case of error, fail gracefully
            if ( typeof(trick.alarm_status) === 'undefined' )
                trick.alarm_status = 0;
                
            cb(trick);
        });
        
        res.on('error', function(ex) {
            console.log("ERROR: " + ex.message);
        });
    }).on('error', function(ex) {
        if ( ex.message === 'connect ETIMEDOUT' )
            console.log("ERROR: The connection timed out");
        else
            console.log("ERROR: " + ex.message);
    });
};

// Use FFMPEG to record from stream
function start_record() {
    if ( !isRecording ) {
        var cmdArgs = [
            '-stats',
            '-y',
            '-loglevel', 'info',
            '-i', 'http://' + _ip + '/videostream.asf' +
                '?user=' + _uname +
                '&pwd=' + _pwd +
                '&resolution=32&rate=0',
            '-shortest',
            '-f', 'segment',
            '-segment_time', '1800',
            '-map', '0',
            '-strftime', '1',
            'cam_%Y-%m-%d-%H-%M-%S.mpeg'
        ];
        
        procRecord = spawn('ffmpeg.exe', cmdArgs);
        procRecord.on('close', function(code) {
            console.log("procRecord.close(" + code + ")");
        });
    }
};

// Stop recording from stream
function stop_record() {
    procRecord.kill();
}

// Kill any running recording sessions before exiting
function exitHandler() {
    console.log("Program exiting...");
    
    if ( isRecording ) {
        stop_record();
    }
    
    process.exit();
};

// Catch-all
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('uncaughtException', exitHandler);

var errorFlag = false;
process.argv.forEach(function (val, index, array) {
    if ( index < 2 || skipNext || errorFlag ) {
        skipNext = false;
    } else {
        skipNext = true;
        
        switch( val ) {
            case '-h': {
                _ip = array[index+1];
            } break;
            
            case '-u': {
                _uname = encodeURIComponent(array[index+1]);
            } break;
            
            case '-p': {
                _pwd = encodeURIComponent(array[index+1]);
            } break;
            
            case '-t': {
                _alarmBuffer = array[index+1];
                if ( isNaN(_alarmBuffer) ) {
                    console.log("Alarm buffer timeout requires a number value");
                    errorFlag = true;
                }
            } break;
            
            case '-sound-on': {
                _alarmSound = 1;
                skipNext = false;
            } break;
            
            case '-sound-off': {
                _alarmSound = 0;
                skipNext = false;
            } break;
            
            case '-motion-on': {
                _alarmMotion = 1;
                skipNext = false;
            } break;
            
            case '-motion-off': {
                _alarmMotion = 0;
                skipNext = false;
            } break;
            
            default: {
                console.log("ERROR: Unknown command '" + val + "'");
                errorFlag = true;
            } break;
        }
    }
});

if ( errorFlag ||
     _ip === '' || _ip === 'undefined' || 
     _uname === '' || _uname === 'undefined' || 
     _pwd === '' || _pwd === 'undefined' ) {
    console.log("USAGE: insteon-wificam.js -h HOST -u USERNAME -p PASSWORD [-t 30] [-sound-on/off -motion-on/off]");
    process.exit();
}

api_getStatus(function(trick){
    if ( trick !== null ) {
        console.log("Options:");
        console.log(" IP: " + _ip);
        console.log(" Motion alarm: " + ((_alarmMotion > 0) ? "On" : "Off"));
        console.log(" Sound alarm: " + ((_alarmSound > 0) ? "On" : "Off"));
        console.log(" Alarm buffer: " + _alarmBuffer + "s");
        console.log("\nCamera:");
        console.log(" INSTEON IP Camera Utility");
        console.log(" Device ID: " + trick.id);
        console.log(" Firmware: " + trick.sys_ver);
        console.log(" Web UI: " + trick.app_ver);
        console.log(" Alias: " + trick.alias);
        console.log(" WiFi Enabled? " + ((trick.wifi_status > 0) ? "Yes" : "No"));
        
        // Reset + enable any alarms
        api_setAlarm(function(){
            // Main loop (1s interval)
            console.log("Waiting for alarm...");
            var st = timers.setInterval(function(){
                api_getStatus(function(trick){
                    
                    if ( trick.alarm_status > 0 ) {
                        var ts = new Date();
                        console.log("[" + ts.toString() + "] " +
                            alarmType[trick.alarm_status] + " Alarm Triggered");
                        
                        if ( !isRecording ) {
                            console.log("Recording...");
                            start_record();
                            isRecording = true;
                        }
                        
                        _alarmBuffer = 0;
                        wasAlarm = true;
                        
                    } else if ( _alarmBuffer < 30 && isRecording ) {
                        console.log("Buffer in effect");
                        _alarmBuffer++;
                    } else {
                        if ( isRecording ) {
                            console.log("Stopped...");
                            stop_record();
                            isRecording = false;
                        }
                        
                        _alarmBuffer = 0;
                        wasAlarm = false;
                    }
                });
            }, 1000);
        });
    }
});


