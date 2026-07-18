const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { createUserSchema, updateUserSchema } = require('../validators/user');
const { ROLES } = require('../constants');

router.use(authenticate);

router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.getUsers);
router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateBody(createUserSchema),
  userController.createUser
);
router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.getUserById);
router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validateBody(updateUserSchema),
  userController.updateUser
);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), userController.deleteUser);

module.exports = router;
