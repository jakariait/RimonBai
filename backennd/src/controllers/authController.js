const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, result, 'Login successful');
};

const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshToken(token);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendSuccess(res, tokens, 'Token refreshed');
};

const logout = async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out successfully');
};

const getProfile = async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  sendSuccess(res, user);
};

const changePassword = async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, null, 'Password changed successfully');
};

module.exports = { login, refreshToken, logout, getProfile, changePassword };
