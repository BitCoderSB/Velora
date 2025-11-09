import { Router } from 'express';
import { identifyParticipants } from '../../app/identify-participants.js';
import { initiateCharge } from '../../app/initiate-charge.js';
import {
  createIncomingPaymentDetails,
  requestAuthorizationUrl,
  finalizeAuthorizedPayment
} from '../../domain/services/secondFlow.js';

const paymentsRouter = Router();

function handleError(res, error, fallbackMessage) {
  const status = error?.statusCode ?? 400;
  res.status(status).json({
    message: error?.message ?? fallbackMessage,
    error: true
  });
}

paymentsRouter.post('/identify', async (req, res) => {
  try {
    const response = await identifyParticipants(req.body);
    res.status(200).json({
      message: 'Identificación exitosa, autorizado para enviar monto a cobrar.',
      ...response
    });
  } catch (error) {
    handleError(res, error, 'No se pudo identificar a los participantes');
  }
});

paymentsRouter.post('/charge', async (req, res) => {
  try {
    const result = await initiateCharge(req.body);
    res.status(200).json({
      message: 'Cobro iniciado, pendiente de consentimiento del cliente.',
      ...result
    });
  } catch (error) {
    handleError(res, error, 'No se pudo iniciar el cobro');
  }
});

paymentsRouter.post('/second-flow/incoming', async (req, res) => {
  try {
    const payload = await createIncomingPaymentDetails(req.body ?? {});
    res.status(201).json({
      message: 'Incoming payment creado con éxito.',
      ...payload
    });
  } catch (error) {
    handleError(res, error, 'No se pudo crear el incoming payment');
  }
});

paymentsRouter.post('/second-flow/authorize', async (req, res) => {
  try {
    const payload = await requestAuthorizationUrl(req.body ?? {});
    res.status(200).json({
      message: 'Se generó la autorización, el usuario debe aprobarla.',
      ...payload
    });
  } catch (error) {
    handleError(res, error, 'No se pudo generar la autorización');
  }
});

paymentsRouter.post('/second-flow/finalize', async (req, res) => {
  try {
    const payload = await finalizeAuthorizedPayment(req.body ?? {});
    res.status(200).json({
      message: 'Pago finalizado exitosamente.',
      ...payload
    });
  } catch (error) {
    handleError(res, error, 'No se pudo finalizar el pago');
  }
});

export { paymentsRouter };
