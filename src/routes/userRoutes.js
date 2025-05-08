const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User related endpoints
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/profile',
  [
    auth,
    check('name', 'Name must not be empty if provided').optional().not().isEmpty(),
    check('firstName', 'First name must not be empty if provided').optional().not().isEmpty(),
    check('country', 'Country must not be empty if provided').optional().not().isEmpty()
  ],
  userController.updateProfile
);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized or current password is incorrect
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post(
  '/change-password',
  [
    auth,
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  userController.changePassword
);

/**
 * @swagger
 * /api/users/messages:
 *   get:
 *     summary: Get user's direct messages
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recipientId
 *         schema:
 *           type: string
 *         description: Filter messages by recipient
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/messages', auth, userController.getDirectMessages);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (for finding chat partners)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, firstName, or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, userController.getAllUsers);

module.exports = router;