# Insteon 75790 Wireless IP Camera Recorder
Node.js app to record live video from your Insteon 75790 WiFi IP camera

## Getting Started
* Install <a href="https://www.ffmpeg.org/download.html">FFMPEG</a>
* Install <a href="http://nodejs.org/">Node.js</a>
* Install NPM (if it wasn't installed with Node.js)

### Gather information
You'll need your camera's IP address and your username + password for the camera.

Basically, this app checks the camera status every second and sees if an alert has been generated (by motion, sound, or external input). Then it will begin recording until the camera clears the alert. The camera usually holds an alert state for about a minute and a half. Unfortunately, there seems to be a design flaw where it will clear the alarm state for a few seconds before re-arming it (even if it sees motion the entire time). To mitigate this, I've placed a configurable (30s default) buffer that will continue the recording process once the alarm is cleared so that if the camera did, in fact, have an alarm pending it will not cause the recording to stop and then shortly after record again (multiple small video files).

### Configure FFMPEG
If FFMPEG is not installed in your PATH, place the FFMPEG executable (ffmpeg.exe) in the same folder as insteon.js. If FFMPEG is not found, the application will terminate as soon as it tries to record.

### Run the program
 ```USAGE: insteon-wificam.js -h HOST -u USERNAME -p PASSWORD [-o PATH] [-t 30] [-sound-on/off -motion-on/off] [-P 80]```

 ```  node insteon.js -h 172.16.0.112 -u admin -p p4ssw0rd -o "C:\\%Y-%m-%d-%H-%M-%S-CAM01.mpeg" -t 120 -motion-on -sound-off```

 Replace the obvious parts (IP address, username, password) with your own values and you should be good to go. The example above will send the username/password to the host at 172.16.0.112, enable both motion and sound alarms, and set a 2 minute buffer. The output path is system-dependant.

 This is an incredibly crude application that I hacked together to solve my own problem with the Insteon 75790 camera but I hope it can help others. To read more about the Insteon 75790 HTTP API and video recording functionality, see my post about it - https://joscor.com/blog/insteon-75790-video-recording-cgi-api/
