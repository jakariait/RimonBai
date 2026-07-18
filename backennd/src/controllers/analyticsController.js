const analyticsService = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

const getDashboardStats = async (req, res) => {
  const stats = await analyticsService.getDashboardStats(
    req.query.period,
    req.query.startDate,
    req.query.endDate
  );
  sendSuccess(res, stats, 'Dashboard stats fetched successfully');
};

const getProfitLoss = async (req, res) => {
  const pl = await analyticsService.getProfitLoss(
    req.query.period,
    req.query.startDate,
    req.query.endDate
  );
  sendSuccess(res, pl, 'Profit & Loss fetched successfully');
};

module.exports = { getDashboardStats, getProfitLoss };
