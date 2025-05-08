const express = require('express');
const { check } = require('express-validator');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin related endpoints
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering users
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       500:
 *         description: Server error
 */
router.get('/users', [auth, isAdmin], adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:userId', [auth, isAdmin], adminController.getUserById);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new admin user (admin only)
 *     tags: [Admin]
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
 *               - firstName
 *               - email
 *               - country
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               firstName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               country:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Validation error or user already exists
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       500:
 *         description: Server error
 */
router.post(
  '/users',
  [
    auth,
    isAdmin,
    check('name', 'Name is required').not().isEmpty(),
    check('firstName', 'First name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('country', 'Country is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  adminController.createAdmin
);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/users/:userId',
  [
    auth,
    isAdmin,
    check('name', 'Name must not be empty if provided').optional().not().isEmpty(),
    check('firstName', 'First name must not be empty if provided').optional().not().isEmpty(),
    check('country', 'Country must not be empty if provided').optional().not().isEmpty(),
    check('role', 'Role must be either user or admin if provided').optional().isIn(['user', 'admin']),
    check('isVerified', 'isVerified must be a boolean if provided').optional().isBoolean()
  ],
  adminController.updateUser
);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:userId', [auth, isAdmin], adminController.deleteUser);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not an admin
 *       500:
 *         description: Server error
 */
router.get('/dashboard', [auth, isAdmin], adminController.getDashboardStats);

module.exports = router;