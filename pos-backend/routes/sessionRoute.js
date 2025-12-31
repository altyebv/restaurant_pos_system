const express = require('express');
const router = express.Router();
const { isVerifiedUser } = require('../middlewares/tokenVerification');
const { openSession, getCurrentSession, closeSession, addExpense, getSessions, getSessionById } = require('../controllers/sessionController');

router.route('/open').post(isVerifiedUser, openSession);
router.route('/close').post(isVerifiedUser, closeSession);
router.route('/current').get(isVerifiedUser, getCurrentSession);
router.route('/').get(isVerifiedUser, getSessions);
router.route('/:id').get(isVerifiedUser, getSessionById);
router.route('/:sessionId/expense').post(isVerifiedUser, addExpense);

module.exports = router;
