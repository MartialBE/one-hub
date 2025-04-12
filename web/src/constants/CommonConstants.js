export const ITEMS_PER_PAGE = 10; // this value must keep same as the one defined in backend!
export const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

// 页面分页大小本地存储键
const PAGE_SIZE_STORAGE_KEY = 'user_page_sizes';

/**
 * 从localStorage获取页面大小
 * @param {string} pageKey - 页面唯一标识
 * @param {number} defaultSize - 默认页面大小
 * @returns {number} - 页面大小
 */
export const getPageSize = (pageKey, defaultSize = ITEMS_PER_PAGE) => {
  try {
    const pageSizesStr = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (pageSizesStr) {
      const pageSizes = JSON.parse(pageSizesStr);
      if (pageSizes[pageKey] !== undefined) {
        return parseInt(pageSizes[pageKey], 10);
      }
    }
    return defaultSize;
  } catch (error) {
    console.error('get page size error:', error);
    return defaultSize;
  }
};

/**
 * 保存页面大小到localStorage
 * @param {string} pageKey - 页面唯一标识
 * @param {number} size - 页面大小
 */
export const savePageSize = (pageKey, size) => {
  try {
    let pageSizes = {};
    const pageSizesStr = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (pageSizesStr) {
      pageSizes = JSON.parse(pageSizesStr);
    }
    pageSizes[pageKey] = size;
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, JSON.stringify(pageSizes));
  } catch (error) {
    console.error('save page size error:', error);
  }
};
