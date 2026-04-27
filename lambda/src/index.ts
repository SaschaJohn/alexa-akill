import * as Alexa from 'ask-sdk-core';
import { LaunchHandler } from './handlers/LaunchHandler';
import { SelectSeriesHandler } from './handlers/SelectSeriesHandler';
import { UserEventHandler } from './handlers/UserEventHandler';
import {
  PauseHandler, ResumeHandler, NextHandler, PreviousHandler,
  PlaybackControllerPauseHandler, PlaybackControllerPlayHandler,
  PlaybackControllerNextHandler, PlaybackControllerPreviousHandler,
  SystemExceptionHandler,
} from './handlers/PlaybackControlHandlers';
import {
  PlaybackStartedHandler,
  PlaybackFinishedHandler,
  PlaybackStoppedHandler,
  PlaybackNearlyFinishedHandler,
  PlaybackFailedHandler,
} from './handlers/AudioPlayerHandlers';
import { SessionEndedHandler } from './handlers/SessionEndedHandler';

const ErrorHandler: Alexa.ErrorHandler = {
  canHandle(): boolean {
    return true;
  },
  handle(handlerInput, error): any {
    const req = handlerInput.requestEnvelope.request;
    console.error('Error:', error.message, 'RequestType:', req.type,
      'Intent:', (req as any).intent?.name, error.stack);
    return handlerInput.responseBuilder
      .speak('Ein Fehler ist aufgetreten.')
      .getResponse();
  },
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchHandler,
    UserEventHandler,
    SelectSeriesHandler,
    PauseHandler,
    ResumeHandler,
    NextHandler,
    PreviousHandler,
    PlaybackStartedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFailedHandler,
    PlaybackControllerPauseHandler,
    PlaybackControllerPlayHandler,
    PlaybackControllerNextHandler,
    PlaybackControllerPreviousHandler,
    SystemExceptionHandler,
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
