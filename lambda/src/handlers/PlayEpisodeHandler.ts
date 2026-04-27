import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { getEpisodeById, resolveAudioUrl, resolveCoverUrl } from '../util/content';
import { getEpisodeProgress } from '../util/progress';
import { saveDeviceState } from '../util/device-state';

export async function playEpisode(
  handlerInput: HandlerInput,
  episodeId: string
): Promise<Response> {
  const result = await getEpisodeById(episodeId);
  if (!result) {
    return handlerInput.responseBuilder
      .speak('Folge nicht gefunden.')
      .getResponse();
  }

  const { series, episode } = result;
  const audioUrl = resolveAudioUrl(episode.file);
  const coverUrl = resolveCoverUrl(series.cover);

  const userId = handlerInput.requestEnvelope.session?.user?.userId
    || handlerInput.requestEnvelope.context.System.user?.userId
    || '';
  const deviceId = handlerInput.requestEnvelope.context.System.device?.deviceId || 'unknown';
  const progress = await getEpisodeProgress(userId, episodeId);
  const offsetMs = progress?.status === 'playing' ? progress.offsetMs : 0;

  await saveDeviceState(userId, deviceId, episode.id, series.id, offsetMs);

  const token = JSON.stringify({
    episodeId: episode.id,
    seriesId: series.id,
    number: episode.number,
  });

  return handlerInput.responseBuilder
    .addAudioPlayerPlayDirective(
      'REPLACE_ALL',
      audioUrl,
      token,
      offsetMs,
      undefined,
      {
        title: episode.title,
        subtitle: `${series.title} - Folge ${episode.number}`,
        art: {
          contentDescription: series.title,
          sources: [{ url: coverUrl }],
        },
      }
    )
    .getResponse();
}

export const PlayEpisodeHandler: RequestHandler = {
  canHandle(): boolean {
    return false;
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};
