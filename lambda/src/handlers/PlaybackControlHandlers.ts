import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { resolveAudioUrl, resolveCoverUrl, getEpisodeById } from '../util/content';
import { playEpisode } from './PlayEpisodeHandler';
import { getDeviceState } from '../util/device-state';

const SEEK_OFFSET_MS = 30_000;

function getAudioPlayerToken(handlerInput: HandlerInput): { episodeId: string; seriesId: string; number: number } | null {
  try {
    const token = handlerInput.requestEnvelope.context.AudioPlayer?.token;
    return token ? JSON.parse(token) : null;
  } catch {
    return null;
  }
}

export async function seekByOffset(handlerInput: HandlerInput, deltaMs: number): Promise<Response> {
  const tokenData = getAudioPlayerToken(handlerInput);
  if (!tokenData) {
    return handlerInput.responseBuilder.getResponse();
  }

  const audioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
  const currentOffsetMs = audioPlayer?.offsetInMilliseconds || 0;
  const newOffsetMs = Math.max(0, currentOffsetMs + deltaMs);

  const result = await getEpisodeById(tokenData.episodeId);
  if (!result) {
    return handlerInput.responseBuilder.getResponse();
  }

  const { series, episode } = result;
  const coverUrl = resolveCoverUrl(series.cover);

  const token = JSON.stringify({
    episodeId: episode.id,
    seriesId: series.id,
    number: episode.number,
  });

  return handlerInput.responseBuilder
    .addAudioPlayerPlayDirective(
      'REPLACE_ALL',
      resolveAudioUrl(episode.file),
      token,
      newOffsetMs,
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

export const PauseHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .getResponse();
  },
};

export const ResumeHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const tokenData = getAudioPlayerToken(handlerInput);
    if (tokenData) {
      return playEpisode(handlerInput, tokenData.episodeId);
    }

    const userId = handlerInput.requestEnvelope.session?.user?.userId
      || handlerInput.requestEnvelope.context.System.user?.userId
      || '';
    const deviceId = handlerInput.requestEnvelope.context.System.device?.deviceId || 'unknown';
    const deviceState = await getDeviceState(userId, deviceId);
    if (deviceState?.episodeId) {
      return playEpisode(handlerInput, deviceState.episodeId);
    }

    return handlerInput.responseBuilder
      .speak('Nichts zum Fortsetzen.')
      .getResponse();
  },
};

export const NextHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    return seekByOffset(handlerInput, SEEK_OFFSET_MS);
  },
};

export const PreviousHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    return seekByOffset(handlerInput, -SEEK_OFFSET_MS);
  },
};

export const PlaybackControllerPauseHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.PauseCommandIssued';
  },
  handle(handlerInput: HandlerInput): Response {
    return handlerInput.responseBuilder
      .addAudioPlayerStopDirective()
      .getResponse();
  },
};

export const PlaybackControllerPlayHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.PlayCommandIssued';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const tokenData = getAudioPlayerToken(handlerInput);
    if (tokenData) {
      return playEpisode(handlerInput, tokenData.episodeId);
    }

    const userId = handlerInput.requestEnvelope.context.System.user?.userId || '';
    const deviceId = handlerInput.requestEnvelope.context.System.device?.deviceId || 'unknown';
    const deviceState = await getDeviceState(userId, deviceId);
    if (deviceState?.episodeId) {
      return playEpisode(handlerInput, deviceState.episodeId);
    }

    return handlerInput.responseBuilder.getResponse();
  },
};

export const PlaybackControllerNextHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.NextCommandIssued';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    return seekByOffset(handlerInput, SEEK_OFFSET_MS);
  },
};

export const PlaybackControllerPreviousHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.PreviousCommandIssued';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    return seekByOffset(handlerInput, -SEEK_OFFSET_MS);
  },
};

export const SystemExceptionHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput: HandlerInput): Response {
    console.error('System.ExceptionEncountered:', JSON.stringify(handlerInput.requestEnvelope.request));
    return handlerInput.responseBuilder.getResponse();
  },
};
