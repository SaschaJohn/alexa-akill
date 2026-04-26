import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { getAllSeries, resolveCoverUrl } from '../util/content';
import { supportsAPL, renderAPL } from '../util/apl';
import SeriesGridTemplate from '../apl/SeriesGridTemplate.json';

export const LaunchHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },

  handle(handlerInput: HandlerInput): Response {
    const series = getAllSeries().map(s => ({
      id: s.id,
      title: s.title,
      coverUrl: resolveCoverUrl(s.cover),
    }));

    if (supportsAPL(handlerInput)) {
      renderAPL(handlerInput, SeriesGridTemplate, {
        seriesData: { series },
      });
    }

    return handlerInput.responseBuilder
      .speak('Willkommen beim Hörspiel Player. Wähle eine Serie.')
      .withShouldEndSession(false)
      .getResponse();
  },
};
