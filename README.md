[![Build Status](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop/build_image)](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop)

## Dev box setup for dcs-app

If you are going to change enketo-core the see section "Making changes to enketo-core".

Download and install android SDK and add the following to your bash_profile and run source ~/.bash_profile

export PATH=${PATH}:adt-bundle-mac-x86_64-20131030/sdk/platform-tools:adt-bundle-mac-x86_64-20131030/sdk/tools
export ANDROID_HOME=adt-bundle-mac-x86_64-20131030/sdk

Install node, sudo npm install -g cordova, npm install -g ripple-emulator

From dcs-app/dcs-folder run following
cordova platform add android

Untar bower_components.tar to dcs-app/dcs-app/www/
cordova prepare
ripple emulate

or connect the mobile and run 
cordova run android

or start android sdk provided simulator and run
cordova emulate android

## Some more information/commands:

Remove chrome ripple plugin if installed already.
npm install -g ripple-emulator
Refer http://www.raymondcamden.com/index.cfm/2013/11/5/Ripple-is-Reborn

ripple emulate --path platforms/android/assets/www
or from root run
ripple emulate 
& use chrome

### For remote debugging
Update the index file with host_ip
weinre -boundHost host_ip

## Making changes to enketo-core

git submodule update --init --recursive
cd enketo-core
npm install
gem install sass or gem update sass

The enketo-core dependency is added by copying the artificats (js, css & fonts) by running the cp-enketo-build.sh from the code root folder.
After making required changes to enketo-core, run the grunt compile target to create the new artificats

