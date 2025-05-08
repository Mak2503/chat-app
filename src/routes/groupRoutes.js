const express = require('express');
const { check } = require('express-validator');
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group related endpoints
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    auth,
    check('name', 'Group name is required').not().isEmpty(),
    check('description').optional()
  ],
  groupController.createGroup
);

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering groups
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of groups to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of groups to skip
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, groupController.getAllGroups);

/**
 * @swagger
 * /api/groups/user:
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's groups retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get('/user', auth, groupController.getUserGroups);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get('/:groupId', auth, groupController.getGroupById);

/**
 * @swagger
 * /api/groups/{groupId}/join:
 *   post:
 *     summary: Join a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Successfully joined the group
 *       400:
 *         description: Already a member
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.post('/:groupId/join', auth, groupController.joinGroup);

/**
 * @swagger
 * /api/groups/{groupId}/leave:
 *   post:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Successfully left the group
 *       400:
 *         description: Not a member or creator cannot leave
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.post('/:groupId/leave', auth, groupController.leaveGroup);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   put:
 *     summary: Update group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the group creator
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:groupId',
  [
    auth,
    check('name', 'Group name must not be empty if provided').optional().not().isEmpty(),
    check('description').optional()
  ],
  groupController.updateGroup
);

/**
 * @swagger
 * /api/groups/{groupId}:
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not the group creator
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.delete('/:groupId', auth, groupController.deleteGroup);

module.exports = router;