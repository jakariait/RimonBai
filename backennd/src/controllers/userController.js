const userService = require('../services/userService');
const { sendSuccess } = require('../utils/response');

const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, user, 'User created successfully', 201);
};

const getUsers = async (req, res) => {
  const result = await userService.getUsers(req.query);
  sendSuccess(res, result.data, 'Users fetched successfully', 200, result.meta);
};

const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, user);
};

const updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, user, 'User updated successfully');
};

const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendSuccess(res, null, 'User deleted successfully');
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
