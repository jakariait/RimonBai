const Category = require('../models/Category');
const { sendSuccess } = require('../utils/response');

const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  sendSuccess(res, category, 'Category created successfully', 201);
};

const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  sendSuccess(res, categories);
};

const getCategoryById = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  sendSuccess(res, category);
};

const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  sendSuccess(res, category, 'Category updated successfully');
};

const deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  sendSuccess(res, null, 'Category deleted successfully');
};

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
