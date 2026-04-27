import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { showEpisodeList } from './SelectSeriesHandler';
import { playEpisode } from './PlayEpisodeHandler';
import { LaunchHandler } from './LaunchHandler';

export const UserEventHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent';
  },

  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as any;
    const args: string[] = request.arguments || [];
    const action = args[0];

    switch (action) {
      case 'SelectSeries':
        return showEpisodeList(handlerInput, args[1]);

      case 'PlayEpisode':
        return playEpisode(handlerInput, args[1]);

      case 'ResumeDevice':
        return playEpisode(handlerInput, args[1]);

      case 'GoBack':
        return LaunchHandler.handle(handlerInput);

      case 'ToggleFilter': {
        const sessionAttrs = handlerInput.attributesManager.getSessionAttributes();
        const showAll = !sessionAttrs.showAll;
        sessionAttrs.showAll = showAll;
        handlerInput.attributesManager.setSessionAttributes(sessionAttrs);
        return showEpisodeList(handlerInput, args[1], showAll);
      }

      default:
        return handlerInput.responseBuilder.getResponse();
    }
  },
};
