// 豆瓣图书孔夫子价格助手 - Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchKongfzPrice') {
    fetchKongfzPrice(request.isbn, request.config)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放，支持异步响应
  }
  
  if (request.action === 'fetchTaoshuPrice') {
    fetchTaoshuPrice(request.isbn)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function fetchKongfzPrice(isbn, config) {
  const baseURL = 'https://search.kongfz.com/pc-gw/search-web/client/pc/product/keyword/list';
  const params = new URLSearchParams({
    dataType: '0',
    keyword: isbn,
    page: '1',
    sortType: '7',
    quality: config.quality,
    hasStock: 'true',
    isNewBook: 'false',
    actionPath: 'quality,sortType',
    userArea: '13003000000'
  });

  const url = `${baseURL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
        'Referer': `https://search.kongfz.com/product/?dataType=0&keyword=${isbn}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1) {
      throw new Error(data.message || 'API返回错误');
    }

    // data.data 可能是对象或 JSON 字符串
    let responseData;
    if (typeof data.data === 'string') {
      responseData = JSON.parse(data.data);
    } else {
      responseData = data.data;
    }

    const bookList = responseData.itemResponse.list;
    const totalCount = responseData.itemResponse.total;

    if (!bookList || bookList.length === 0) {
      throw new Error('未找到在售商品');
    }

    // 提取价格列表（包含运费）
    const priceList = bookList.map(book => {
      let totalPrice = book.price;
      if (!book.postage?.sellerPayFreight && book.postage?.shippingList?.length > 0) {
        totalPrice += book.postage.shippingList[0].shippingFee;
      }
      return {
        price: totalPrice,
        title: book.title,
        pubDateText: book.pubDateText
      };
    });

    // 跳过最低价
    const sortedPrices = [...priceList].sort((a, b) => a.price - b.price);
    const filteredPrices = sortedPrices.slice(config.skipLowest);

    // 取样计算平均价
    const sampleSize = Math.min(config.sampleCount, filteredPrices.length);
    if (sampleSize === 0) {
      throw new Error('有效样本数量不足');
    }

    const samplePrices = filteredPrices.slice(0, sampleSize);
    const avgPrice = samplePrices.reduce((sum, item) => sum + item.price, 0) / sampleSize;

    // 统计最频繁的标题
    const titleCount = {};
    const titlePubDate = {};
    samplePrices.forEach(item => {
      titleCount[item.title] = (titleCount[item.title] || 0) + 1;
      titlePubDate[item.title] = item.pubDateText;
    });

    let mainTitle = '';
    let mainPubDate = '';
    let maxCount = 0;
    for (const [title, count] of Object.entries(titleCount)) {
      if (count > maxCount) {
        maxCount = count;
        mainTitle = title;
        mainPubDate = titlePubDate[title];
      }
    }

    return {
      isbn: isbn,
      title: mainTitle,
      pubDateText: mainPubDate,
      avgPrice: avgPrice,
      totalCount: totalCount,
      sampleCount: sampleSize,
      skipLowest: config.skipLowest,
      quality: config.quality,
      minPrice: Math.min(...samplePrices.map(p => p.price)),
      maxPrice: Math.max(...samplePrices.map(p => p.price))
    };

  } catch (error) {
    throw new Error(`获取价格失败: ${error.message}`);
  }
}

// 淘书网价格查询
async function fetchTaoshuPrice(isbn) {
  const baseURL = 'https://api.taoshu.com/api/v0/book/query/byIsbnOrName';
  const params = new URLSearchParams({
    page: '1',
    pageSize: '24',
    isbnOrName: isbn
  });

  const url = `${baseURL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'dnt': '1',
        'origin': 'https://www.taoshu.com',
        'referer': 'https://www.taoshu.com/',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();

    if (data.resultCode !== 'OK') {
      throw new Error(data.resultDescription || 'API返回错误');
    }

    const bookList = data.data.bookList;
    const total = data.data.total;

    if (!bookList || bookList.length === 0) {
      throw new Error('未找到在售商品');
    }

    // 返回第一个图书的价格信息（价格单位是分，需要转换为元）
    const book = bookList[0];
    const salePrice = book.salePrice / 100; // 转换为元
    const originalPrice = book.price / 100; // 转换为元

    return {
      isbn: book.isbn,
      bookID: book.id,
      name: book.name,
      author: book.author,
      press: book.press,
      salePrice: salePrice,
      originalPrice: originalPrice,
      inventory: book.inventory,
      totalInventory: book.totalInventory,
      total: total
    };

  } catch (error) {
    throw new Error(`获取淘书网价格失败: ${error.message}`);
  }
}
