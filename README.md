[![Build Status](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop/build_image)](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop)

## Dev box setup for dcs-app

The source is in folder dcs-app/dcs-app/www

Make sure to have android SDK avaiable in PATH and ANDROID_HOME set.

Install node and sudo npm install -g cordova

cd dcs-app/dcs-app
cordova platform add android

\#connect the android mobile and cordova run android

\#start android sdk provided simulator and run cordova emulate android

## Making changes to enketo-core

git submodule update --init --recursive

Refer [enketo-core](https://github.com/enketo/enketo-core) to setup for dev

After making required changes to enketo-core, run the enketo grunt compile target to create the artificats.
The enketo-core dependency is added by copying the artificats (js, css & fonts) by running the cp-enketo-build.sh from the code root folder.


