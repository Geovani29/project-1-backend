const getPaginationParams = (page = 1, limit = 10) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  const validPage = pageNum < 1 ? 1 : pageNum;
  const validLimit = limitNum < 1 ? 10 : limitNum > 100 ? 100 : limitNum;
  
  const offset = (validPage - 1) * validLimit;
  
  return {
    offset,
    limit: validLimit,
    page: validPage
  };
};

const buildPaginationResponse = (data, count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  
  return {
    data,
    pagination: {
      total: count,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPaginationParams,
  buildPaginationResponse
};
