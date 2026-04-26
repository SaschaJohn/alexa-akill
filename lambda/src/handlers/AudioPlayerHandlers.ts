import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { savePosition, markPlayed } from '../util/progress';
import { getNextEpisode, resolveAudioUrl, resolveCoverUrl, getSeriesById } from '../util/content';

function parseToken(token: string): { episodeId: string; seriesId: string; number: number } | null {
  try {
    return JSON.parse(token);
  } catch {
    return null;
  }
}

function getUserId(handlerInput: HandlerInput): string {
  return handlerInput.requestEnvelope.context.System.user?.userId || '';
}

export const PlaybackStartedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackFinishedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFinished';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as any;
    const tokenData = parseToken(request.token || '');
    if (tokenData) {
      await markPlayed(getUserId(handlerInput), tokenData.episodeId, tokenData.seriesId);
    }
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackStoppedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStopped';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as any;
    const tokenData = parseToken(request.token || '');
    if (tokenData) {
      await savePosition(
        getUserId(handlerInput),
        tokenData.episodeId,
        tokenData.seriesId,
        request.offsetInMilliseconds || 0
      );
    }
    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackNearlyFinishedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackNearlyFinished';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const request = handlerInput.requestEnvelope.request as any;
    const tokenData = parseToken(request.token || '');
    if (!tokenData) return handlerInput.responseBuilder.getResponse();

    const nextEpisode = getNextEpisode(tokenData.seriesId, tokenData.number);
    if (!nextEpisode) return handlerInput.responseBuilder.getResponse();

    const series = getSeriesById(tokenData.seriesId);
    if (!series) return handlerInput.responseBuilder.getResponse();

    const nextToken = JSON.stringify({
      episodeId: nextEpisode.id,
      seriesId: tokenData.seriesId,
      number: nextEpisode.number,
    });

    return handlerInput.responseBuilder
      .addAudioPlayerPlayDirective(
        'ENQUEUE',
        resolveAudioUrl(nextEpisode.file),
        nextToken,
        0,
        request.token,
        {
          title: nextEpisode.title,
          subtitle: `${series.title} - Folge ${nextEpisode.number}`,
          art: {
            contentDescription: series.title,
            sources: [{ url: resolveCoverUrl(series.cover) }],
          },
        }
      )
      .getResponse();
  },
};

export const PlaybackFailedHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackFailed';
  },
  handle(handlerInput: HandlerInput): Response {
    console.error('Playback failed:', JSON.stringify(handlerInput.requestEnvelope.request));
    return handlerInput.responseBuilder.getResponse();
  },
};
