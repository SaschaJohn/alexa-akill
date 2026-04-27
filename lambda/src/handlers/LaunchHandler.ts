import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { getAllSeries, getEpisodeById, resolveCoverUrl, resolveEpisodeCoverUrl } from '../util/content';

import { getLastPlayingEpisode } from '../util/progress';
import { getDeviceState } from '../util/device-state';
import { supportsAPL, renderAPL } from '../util/apl';
import SeriesGridTemplate from '../apl/SeriesGridTemplate.json';

export const LaunchHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },

  async handle(handlerInput: HandlerInput): Promise<Response> {
    const series = (await getAllSeries()).map(s => ({
      id: s.id,
      title: s.title,
      coverUrl: resolveCoverUrl(s.cover),
    }));

    const userId = handlerInput.requestEnvelope.session?.user?.userId
      || handlerInput.requestEnvelope.context.System.user?.userId
      || '';
    const deviceId = handlerInput.requestEnvelope.context.System.device?.deviceId || 'unknown';

    let resumeData: { episodeId: string; title: string; seriesTitle: string; coverUrl: string } | null = null;

    const deviceState = await getDeviceState(userId, deviceId);

    if (deviceState && deviceState.offsetMs > 0) {
      const result = await getEpisodeById(deviceState.episodeId);
      if (result) {
        resumeData = {
          episodeId: result.episode.id,
          title: result.episode.title,
          seriesTitle: result.series.title,
          coverUrl: resolveEpisodeCoverUrl(result.episode, result.series),
        };
      }
    }

    if (!resumeData) {
      const lastPlaying = await getLastPlayingEpisode(userId);
      if (lastPlaying && lastPlaying.offsetMs > 0) {
        const result = await getEpisodeById(lastPlaying.episodeId);
        if (result) {
          resumeData = {
            episodeId: result.episode.id,
            title: result.episode.title,
            seriesTitle: result.series.title,
            coverUrl: resolveEpisodeCoverUrl(result.episode, result.series),
          };
        }
      }
    }

    if (supportsAPL(handlerInput)) {
      renderAPL(handlerInput, SeriesGridTemplate, {
        seriesData: { series },
        resumeData: resumeData || undefined,
      });
    }

    const speech = resumeData
      ? `Willkommen zurück. Du kannst ${resumeData.title} fortsetzen oder eine Serie wählen.`
      : 'Willkommen beim Hörspiel Player. Wähle eine Serie.';

    return handlerInput.responseBuilder
      .speak(speech)
      .withShouldEndSession(false)
      .getResponse();
  },
};
