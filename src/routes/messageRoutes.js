const express = require('express');
const { check } = require('express-validator');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message related endpoints
 */

/**
 * @swagger
 * /api/messages/direct:
 *   post:
 *     summary: Send direct message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Recipient not found
 *       500:
 *         description: Server error
 */
router.post(
  '/direct',
  [
    auth,
    check('recipientId', 'Recipient ID is required').not().isEmpty(),
    check('content', 'Message content is required').not().isEmpty()
  ],
  messageController.sendDirectMessage
);

/**
 * @swagger
 * /api/messages/group:
 *   post:
 *     summary: Send group message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - content
 *             properties:
 *               groupId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group message sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.post(
  '/group',
  [
    auth,
    check('groupId', 'Group ID is required').not().isEmpty(),
    check('content', 'Message content is required').not().isEmpty()
  ],
  messageController.sendGroupMessage
);

/**
 * @swagger
 * /api/messages/group/{groupId}:
 *   get:
 *     summary: Get messages for a specific group
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get('/group/:groupId', auth, messageController.getGroupMessages);

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to mark this message as read
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.put('/:messageId/read', auth, messageController.markAsRead);

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to delete this message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */
router.delete('/:messageId', auth, messageController.deleteMessage);

module.exports = router;