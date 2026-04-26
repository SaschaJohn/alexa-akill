import * as Alexa from 'ask-sdk-core';
import { LaunchHandler } from './handlers/LaunchHandler';
import { SelectSeriesHandler } from './handlers/SelectSeriesHandler';
import { UserEventHandler } from './handlers/UserEventHandler';
import { PauseHandler, ResumeHandler, NextHandler, PreviousHandler } from './handlers/PlaybackControlHandlers';
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
    console.error('Error:', error.message, error.stack);
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
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
