import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { getSeriesById, resolveEpisodeCoverUrl } from '../util/content';
import { getSeriesProgress } from '../util/progress';
import { supportsAPL, renderAPL } from '../util/apl';
import EpisodeListTemplate from '../apl/EpisodeListTemplate.json';

export async function showEpisodeList(
  handlerInput: HandlerInput,
  seriesId: string,
  showAll: boolean = false
): Promise<Response> {
  const series = await getSeriesById(seriesId);
  if (!series) {
    return handlerInput.responseBuilder
      .speak('Serie nicht gefunden.')
      .withShouldEndSession(false)
      .getResponse();
  }

  const userId = handlerInput.requestEnvelope.session?.user?.userId || '';
  const progressList = await getSeriesProgress(userId, seriesId);
  const playedSet = new Set(
    progressList.filter(p => p.status === 'played').map(p => p.episodeId)
  );

  const episodes = series.episodes
    .map(e => ({
      id: e.id,
      seriesId: seriesId,
      number: e.number,
      title: e.title,
      played: playedSet.has(e.id),
      coverUrl: resolveEpisodeCoverUrl(e, series),
    }))
    .filter(e => showAll || !e.played);

  if (supportsAPL(handlerInput)) {
    renderAPL(handlerInput, EpisodeListTemplate, {
      episodeData: {
        seriesId,
        seriesTitle: series.title,
        episodes,
        filterLabel: showAll ? 'Nur ungespielt' : 'Alle anzeigen',
      },
    });
  }

  const count = episodes.length;
  const speech = showAll
    ? `${series.title}: ${count} Folgen.`
    : `${series.title}: ${count} ungespielt.`;

  return handlerInput.responseBuilder
    .speak(speech)
    .withShouldEndSession(false)
    .getResponse();
}

export const SelectSeriesHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SelectSeriesIntent';
  },

  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request;
    if (request.type !== 'IntentRequest') {
      return handlerInput.responseBuilder.getResponse();
    }
    const seriesName = request.intent.slots?.seriesName?.value || '';
    const allSeries = await (await import('../util/content')).getAllSeries();
    const match = allSeries.find(
      s => s.title.toLowerCase() === seriesName.toLowerCase()
    );

    if (!match) {
      return handlerInput.responseBuilder
        .speak(`Serie ${seriesName} nicht gefunden.`)
        .withShouldEndSession(false)
        .getResponse();
    }

    return showEpisodeList(handlerInput, match.id);
  },
};
