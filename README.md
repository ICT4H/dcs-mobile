
README

Dev box setup for dcs-app:

Clone github repo

dcs-app
 enketo-core
 dcs-app
 cp-enketo-build.sh

Dev setup

If you are going to change enketo-core the see section "Making changes to enketo-core".

Download and install android SDK and add the following to your bash_profile and run source ~/.bash_profile

export PATH=${PATH}:adt-bundle-mac-x86_64-20131030/sdk/platform-tools:adt-bundle-mac-x86_64-20131030/sdk/tools
export ANDROID_HOME=adt-bundle-mac-x86_64-20131030/sdk

Install
 node
 sudo npm install -g cordova
 ripple (To use chrome to access the app instead of simulator or mobile device)
 npm install -g ripple-emulator

cordova platform add android
cordova build android

ripple emulate # if using chrome

or connect the mobile and run 
cordova run android

or start android sdk provided simulator and run
cordova emulate android

----------------------------------

Some more information/commands:

cordova create test
cd dcs-app
cordova platform add android
cordova build android
cordova run android


Application boot strapping:
 requirejs_main loads js files and initialises cordrova.
 When device is ready crodrova bootstraps angular app.
 The angular route waits for store service to resolve before showing up project list.

Remove chrome ripple plugin if installed already.
npm install -g ripple-emulator
http://www.raymondcamden.com/index.cfm/2013/11/5/Ripple-is-Reborn
ripple emulate --path platforms/android/assets/www
or from root run
ripple emulate 
& use chrome

Auto prepare/copy changes form www to platform
In a new shell from the root(<code>/dcs-app/dcs-app) run
node install
grunt
Ctrl C to stop watching for changes done in www to be copied to platform/android.

For remote debugging
weinre -boundHost 192.168.1.2
---------------

Making changes to enketo-core.

git submodule update --init --recursive
cd enketo-core
npm install
gem install sass or gem update sass

The enketo-core dependency is added by copying the artificats (js, css & fonts) by running the cp-enketo-build.sh from the code root folder.
After making required changes to enketo-core, run the grunt compile target to create the new artificats

----------------

