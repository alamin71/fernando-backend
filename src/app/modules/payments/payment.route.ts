import express from 'express';
import {
  PaymentController,
} from './payment.controller';


const router = express.Router();

router.post('/save-card', PaymentController.saveCard );
router.get('/saved-cards/:userId',PaymentController.getSavedCards);
router.post('/make-payment',PaymentController.makePayment);

export const PaymentRoutes = router;
