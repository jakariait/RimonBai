class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search(searchableFields = []) {
    const search = this.queryString.search;
    if (search && searchableFields.length > 0) {
      const searchConditions = searchableFields.map((field) => ({
        [field]: { $regex: search, $options: 'i' },
      }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['search', 'page', 'limit', 'sort', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    if (Object.keys(queryObj).length > 0) {
      this.query = this.query.find(queryObj);
    }
    return this;
  }

  sort(defaultSort = '-createdAt') {
    const sort = this.queryString.sort || defaultSort;
    this.query = this.query.sort(sort);
    return this;
  }

  paginate(defaultLimit = 20) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || defaultLimit;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }

  getPaginationMeta(total) {
    const { page, limit } = this.pagination || { page: 1, limit: 20 };
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }
}

module.exports = APIFeatures;
