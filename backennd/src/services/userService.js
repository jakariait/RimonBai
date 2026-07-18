const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');

const createUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    throw Object.assign(new Error('Email already exists'), { statusCode: 409 });
  }
  return User.create(userData);
};

const getUsers = async (query) => {
  const features = new APIFeatures(User.find(), query)
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate();

  const users = await features.query;
  const total = await User.countDocuments(features.query._conditions);
  return { data: users, meta: features.getPaginationMeta(total) };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

const updateUser = async (id, updateData) => {
  if (updateData.email) {
    const existing = await User.findOne({ email: updateData.email, _id: { $ne: id } });
    if (existing) {
      throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
    }
  }
  const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
