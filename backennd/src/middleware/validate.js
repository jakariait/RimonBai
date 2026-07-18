const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body;
    req.query = parsed.query;
    req.params = parsed.params;
    next();
  } catch (error) {
    const message = error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ success: false, message: message || 'Validation failed' });
  }
};

const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    const message = error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ success: false, message: message || 'Validation failed' });
  }
};

module.exports = { validate, validateBody };
