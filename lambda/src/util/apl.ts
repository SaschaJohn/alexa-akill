import { HandlerInput } from 'ask-sdk-core';

export function supportsAPL(handlerInput: HandlerInput): boolean {
  const supportedInterfaces = handlerInput.requestEnvelope.context.System.device?.supportedInterfaces;
  return !!(supportedInterfaces && 'Alexa.Presentation.APL' in supportedInterfaces);
}

export function renderAPL(
  handlerInput: HandlerInput,
  document: object,
  datasources: object,
  token: string = 'mainToken'
) {
  if (!supportsAPL(handlerInput)) return;

  handlerInput.responseBuilder.addDirective({
    type: 'Alexa.Presentation.APL.RenderDocument',
    token,
    document,
    datasources,
  });
}
