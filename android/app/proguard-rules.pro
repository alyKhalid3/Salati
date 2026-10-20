# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# expo-notifications: reflection-heavy scheduling classes stripped by R8
-keep class expo.modules.notifications.** { *; }
-keep class expo.modules.core.** { *; }

# AsyncStorage: uses reflection for its SQLite-backed adapter
-keep class com.reactnativecommunity.asyncstorage.** { *; }

#expo-location: serialized config objects
-keep class expo.modules.location.** { *; }

# gson / serialization used across expo internals
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*

# Add any project specific keep options here.
