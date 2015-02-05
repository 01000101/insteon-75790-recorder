# Insteon 75790 Wireless IP Camera Recorder
Node.js app to record live video from your Insteon 75790 WiFi IP camera

## Getting Started
* Install <a href="https://www.ffmpeg.org/download.html">FFMPEG</a>
* Install <a href="http://nodejs.org/">Node.js</a>
* Install NPM (if it wasn't installed with Node.js)

### Gather information
You'll need your camera's IP address and your username + password for the camera. 

### Configure FFMPEG
If FFMPEG is not installed in your PATH, place the FFMPEG executable (ffmpeg.exe) in the same folder as insteon.js. 

### Run the program
 ```USAGE: insteon-wificam.js -h HOST -u USERNAME -p PASSWORD [-sound-on/off -motion-on/off]```
 
 ```  node insteon.js -h 172.16.0.112 -u admin -p p4ssw0rd -motion-on -sound-off```
 
 Replace the obvious parts (IP address, username, password) with your own values and you should be good to go. This is an incredibly crude application that I hacked together to solve my own problem with the Insteon 75790 camera but I hope it can help others. To read more about the Insteon 75790 HTTP API and video recording functionality, see my post about it - https://joscor.com/2015/02/insteon-75790-video-recording-cgi-api/
