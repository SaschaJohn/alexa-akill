import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { getEpisodeById, getNextEpisode, getPreviousEpisode } from '../util/content';
import { playEpisode } from './PlayEpisodeHandler';

function getAudioPlayerToken(handlerInput: HandlerInput): { episodeId: string; seriesId: string; number: number } | null {
  try {
    const token = handlerInput.requestEnvelope.context.AudioPlayer?.token;
    return token ? JSON.parse(token) : null;
  } catch {
    return null;
  }
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
    if (!tokenData) {
      return handlerInput.responseBuilder
        .speak('Nichts zum Fortsetzen.')
        .getResponse();
    }
    return playEpisode(handlerInput, tokenData.episodeId);
  },
};

export const NextHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const tokenData = getAudioPlayerToken(handlerInput);
    if (!tokenData) {
      return handlerInput.responseBuilder
        .speak('Keine aktuelle Folge.')
        .getResponse();
    }
    const next = getNextEpisode(tokenData.seriesId, tokenData.number);
    if (!next) {
      return handlerInput.responseBuilder
        .speak('Keine weitere Folge.')
        .getResponse();
    }
    return playEpisode(handlerInput, next.id);
  },
};

export const PreviousHandler: RequestHandler = {
  canHandle(handlerInput: HandlerInput): boolean {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent';
  },
  async handle(handlerInput: HandlerInput): Promise<Response> {
    const tokenData = getAudioPlayerToken(handlerInput);
    if (!tokenData) {
      return handlerInput.responseBuilder
        .speak('Keine aktuelle Folge.')
        .getResponse();
    }
    const prev = getPreviousEpisode(tokenData.seriesId, tokenData.number);
    if (!prev) {
      return handlerInput.responseBuilder
        .speak('Keine vorherige Folge.')
        .getResponse();
    }
    return playEpisode(handlerInput, prev.id);
  },
};
