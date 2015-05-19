
[![Build Status](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop/build_image)](https://snap-ci.com/ICT4H/dcs-mobile/branch/develop)


##Introduction

This is __CollectData__ mobile application for Offline and Online Data Collection.

[![Download App](https://developer.android.com/images/brand/en_app_rgb_wo_45.png)](https://play.google.com/store/apps/details?id=com.thoughtworks.dcs)

####Copyright and license

__Copyright 2015 Thoughtworks__
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

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


