/**
Copyright 2022 Google LLC. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


'use strict';

import { CastQueue } from './queuing.js';
import { MediaFetcher } from './media_fetcher.js';
import { AdsTracker, SenderTracker, ContentTracker } from './cast_analytics.js';
const mirrorImage = document.getElementById("mirrorImage");
const videoPlayer = document.getElementById("videoPlayer");
const message = document.getElementById('message');

/**
 * @fileoverview This sample demonstrates how to build your own Web Receiver for
 * use with Google Cast. The main receiver implementation is provided in this
 * file which sets up access to the CastReceiverContext and PlayerManager. Some
 * added functionality can be enabled by uncommenting some of the code blocks
 * below.
 */


/*
 * Convenience variables to access the CastReceiverContext and PlayerManager.
 */
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

/*
 * Constant to be used for fetching media by entity from sample repository.
 */
const ID_REGEX = '\/?([^\/]+)\/?$';

/**
 * Debug Logger
 */
const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
const LOG_RECEIVER_TAG = 'Receiver';

/*
 * WARNING: Make sure to turn off debug logger for production release as it
 * may expose details of your app.
 * Uncomment below line to enable debug logger, show a 'DEBUG MODE' tag at
 * top left corner and show debug overlay.
 */
//  context.addEventListener(cast.framework.system.EventType.READY, () => {
//   if (!castDebugLogger.debugOverlayElement_) {
//     /**
//      *  Enable debug logger and show a 'DEBUG MODE' tag at
//      *  top left corner.
//      */
//       castDebugLogger.setEnabled(true);

//     /**
//      * Show debug overlay.
//      */
//       castDebugLogger.showDebugLogs(true);
//   }
// });

/*
 * Set verbosity level for Core events.
 */
castDebugLogger.loggerLevelByEvents = {
  'cast.framework.events.category.CORE':
    cast.framework.LoggerLevel.INFO,
  'cast.framework.events.EventType.MEDIA_STATUS':
    cast.framework.LoggerLevel.DEBUG
};

if (!castDebugLogger.loggerLevelByTags) {
  castDebugLogger.loggerLevelByTags = {};
}

/*
 * Set verbosity level for custom tag.
 * Enables log messages for error, warn, info and debug.
 */
castDebugLogger.loggerLevelByTags[LOG_RECEIVER_TAG] =
  cast.framework.LoggerLevel.DEBUG;

/*
 * Example of how to listen for events on playerManager.
 */
playerManager.addEventListener(
  cast.framework.events.EventType.ERROR, (event) => {
    castDebugLogger.error(LOG_RECEIVER_TAG,
      'Detailed Error Code - ' + event.detailedErrorCode);
    if (event && event.detailedErrorCode == 905) {
      castDebugLogger.error(LOG_RECEIVER_TAG,
        'LOAD_FAILED: Verify the load request is set up ' +
        'properly and the media is able to play.');
    }
  });

/*
 * Example analytics tracking implementation. To enable this functionality see
 * the implmentation and complete the TODO item in ./google_analytics.js. Once
 * complete uncomment the the calls to startTracking below to enable each
 * Tracker.
 */
const adTracker = new AdsTracker();
const senderTracker = new SenderTracker();
const contentTracker = new ContentTracker();
// adTracker.startTracking();
// senderTracker.startTracking();
// contentTracker.startTracking();

/**
 * Modifies the provided mediaInformation by adding a pre-roll break clip to it.
 * @param {cast.framework.messages.MediaInformation} mediaInformation The target
 * MediaInformation to be modified.
 * @return {Promise} An empty promise.
 */
function addBreaks(mediaInformation) {
  castDebugLogger.debug(LOG_RECEIVER_TAG, "addBreaks: " +
    JSON.stringify(mediaInformation));
  return MediaFetcher.fetchMediaById('fbb_ad')
    .then((clip1) => {
      mediaInformation.breakClips = [
        {
          id: 'fbb_ad',
          title: clip1.title,
          contentUrl: clip1.stream.dash,
          contentType: 'application/dash+xml',
          whenSkippable: 5
        }
      ];

      mediaInformation.breaks = [
        {
          id: 'pre-roll',
          breakClipIds: ['fbb_ad'],
          position: 0
        }
      ];
    });
}

/*
 * Intercept the LOAD request to load and set the contentUrl.
 */
// playerManager.setMessageInterceptor(
//   cast.framework.messages.MessageType.LOAD,
//   loadRequestData => {
//       console.log("📡 Nhận yêu cầu LOAD:", loadRequestData);
//       message.textContent += "📷 Live stream mode activated!";
//       if (!loadRequestData.media || !loadRequestData.media.contentUrl) {
//         message.textContent += '⚠️ Không có contentUrl trong media.';
//           console.log('❌ Không có contentUrl:', loadRequestData.media);
//           return null;
//       }

//       const imageUrl = loadRequestData.media.contentUrl;
//       console.log('✅ Nhận URL:', imageUrl);

//       if (imageUrl.includes("live=true")) {
//         message.textContent += "📷 Live stream mode activated!";
//           startLiveImageStream(imageUrl);
//       } else {
//         message.textContent += "📷 Loading single image...";
//           loadSingleImage(imageUrl);
//       }
//       return null;
//   }
// );
playerManager.setMessageInterceptor(
  cast.framework.messages.MessageType.LOAD, loadRequestData => {

    if (!loadRequestData || !loadRequestData.media) {
      return new cast.framework.messages.ErrorData(
        cast.framework.messages.ErrorType.LOAD_FAILED,
        cast.framework.messages.ErrorReason.INVALID_REQUEST
      );
    }
    message.textContent = "2222222222";
    let media = loadRequestData.media;
    let mimeType = media.contentType || "";
    let source = media.contentUrl || media.entity || media.contentId;

    if (!source || !source.match(ID_REGEX)) {
      return new cast.framework.messages.ErrorData(
        cast.framework.messages.ErrorType.LOAD_FAILED,
        cast.framework.messages.ErrorReason.INVALID_REQUEST
      );
    }

    let sourceId = source.match(ID_REGEX)[1];

    loadSingleImage(source);
    // if (mimeType.startsWith("image/")) {
    //   // Nếu là ảnh, tải trước ảnh và hiển thị
    //   castDebugLogger.debug(LOG_RECEIVER_TAG, "Loading image...");

    //   loadSingleImage(imageUrl);
    //   return null
    // } else {
    //   // Nếu không phải ảnh, hiển thị videoPlayer và tải như cũ
    //   mirrorImage.style.visibility = 'hidden';
    //   videoPlayer.style.visibility = 'visible';

    //   if (sourceId.includes('.')) {
    //     castDebugLogger.debug(LOG_RECEIVER_TAG, "Interceptor received full URL");
    //     media.contentUrl = source;
    //     return loadRequestData;
    //   } else {
    //     castDebugLogger.debug(LOG_RECEIVER_TAG, "Interceptor received ID");
    //     try {
    //       // const mediaInformation =  MediaFetcher.fetchMediaInformationById(sourceId);
    //       loadRequestData.media = media;
    //       return loadRequestData;
    //     } catch (errorMessage) {
    //       castDebugLogger.error(LOG_RECEIVER_TAG, errorMessage);
    //       return new cast.framework.messages.ErrorData(
    //         cast.framework.messages.ErrorType.LOAD_FAILED,
    //         cast.framework.messages.ErrorReason.INVALID_REQUEST
    //       );
    //     }
    //   }
    // }
  }
);



// Kiểm tra định dạng hình ảnh
function isImageFormat(url) {
  return url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
}

function startLiveImageStream(baseUrl) {
  liveStreamActive = true;
  if (refreshInterval) clearInterval(refreshInterval);

  function updateImage() {
    const timestamp = new Date().getTime();
    const newSrc = baseUrl.split("?")[0] + "?t=" + timestamp; // Tránh cache
    mirrorImage.src = newSrc;
    console.log("🔄 Cập nhật ảnh:", newSrc);
  }

  mirrorImage.onload = function () {
    mirrorImage.style.visibility = 'visible';
    message.textContent = "✅ Streaming live...";
  };

  mirrorImage.onerror = function () {
    console.error("❌ Lỗi tải ảnh, thử lại...");
  };

  updateImage(); // Tải ảnh đầu tiên
  refreshInterval = setInterval(updateImage, 1000); // Cập nhật mỗi giây
}

function loadSingleImage(url) {

  // if (refreshInterval) clearInterval(refreshInterval);

  mirrorImage.src = url;
  mirrorImage.onload = function () {
    mirrorImage.style.visibility = 'visible';
    videoPlayer.style.visibility = 'hidden';
    message.textContent += "✅ Image loaded successfully!";
  };
  mirrorImage.onerror = function () {
    message.textContent += "❌ Error loading image.";
  };
}

/*
 * Set the control buttons in the UI controls.
 */
const controls = cast.framework.ui.Controls.getInstance();
controls.clearDefaultSlotAssignments();

// Assign buttons to control slots.
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_SECONDARY_1,
  cast.framework.ui.ControlsButton.QUEUE_PREV
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_PRIMARY_1,
  cast.framework.ui.ControlsButton.CAPTIONS
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_PRIMARY_2,
  cast.framework.ui.ControlsButton.SEEK_FORWARD_15
);
controls.assignButton(
  cast.framework.ui.ControlsSlot.SLOT_SECONDARY_2,
  cast.framework.ui.ControlsButton.QUEUE_NEXT
);

/*
 * Configure the CastReceiverOptions.
 */
const castReceiverOptions = new cast.framework.CastReceiverOptions();

/*
 * Set the player configuration.
 */
const playbackConfig = new cast.framework.PlaybackConfig();
playbackConfig.autoResumeDuration = 5;
castReceiverOptions.playbackConfig = playbackConfig;
castDebugLogger.info(LOG_RECEIVER_TAG,
  `autoResumeDuration set to: ${playbackConfig.autoResumeDuration}`);

/* 
 * Set the SupportedMediaCommands.
 */
castReceiverOptions.supportedCommands =
  cast.framework.messages.Command.ALL_BASIC_MEDIA |
  cast.framework.messages.Command.QUEUE_PREV |
  cast.framework.messages.Command.QUEUE_NEXT |
  cast.framework.messages.Command.STREAM_TRANSFER

/*
 * Optionally enable a custom queue implementation. Custom queues allow the
 * receiver app to manage and add content to the playback queue. Uncomment the
 * line below to enable the queue.
 */
castReceiverOptions.queue = new CastQueue();

context.start(castReceiverOptions);
