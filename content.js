// 豆瓣图书价格助手 - Content Script

(function() {
  'use strict';

  // 配置参数
  const CONFIG = {
    quality: '90~',
    sampleCount: 5,
    skipLowest: 1
  };

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.info('[豆瓣价格助手] 初始化开始');
    
    // 检查是否已存在价格卡片，防止重复创建
    const existingCard = document.getElementById('secondhand-buyinfo');
    if (existingCard) {
      console.info('[豆瓣价格助手] 价格卡片已存在，跳过创建');
      return;
    }
    
    // 检查是否在图书详情页
    const infoDiv = document.getElementById('info');
    if (!infoDiv) {
      console.info('[豆瓣价格助手] 未找到图书信息区域 #info');
      return;
    }
    console.info('[豆瓣价格助手] 找到图书信息区域 #info');

    const isbn = extractISBN(infoDiv);
    if (!isbn) {
      console.info('[豆瓣价格助手] 未找到ISBN');
      return;
    }

    console.info('[豆瓣价格助手] 找到ISBN:', isbn);

    // 查找插入位置 - 插入到 buyinfo 前面
    const buyInfoDiv = document.getElementById('buyinfo');
    console.info('[豆瓣价格助手] #buyinfo 元素:', buyInfoDiv);
    
    if (buyInfoDiv) {
      console.info('[豆瓣价格助手] 找到 #buyinfo，准备插入价格卡片');
      insertPriceCardBefore(buyInfoDiv, isbn);
    } else {
      // 备用方案1: #subject
      const subjectDiv = document.getElementById('subject');
      console.info('[豆瓣价格助手] #subject 元素:', subjectDiv);
      
      if (subjectDiv) {
        console.info('[豆瓣价格助手] 未找到 #buyinfo，使用备用方案 #subject');
        insertPriceCardBefore(subjectDiv, isbn);
      } else {
        // 备用方案2: #content
        const contentDiv = document.getElementById('content');
        console.info('[豆瓣价格助手] #content 元素:', contentDiv);
        
        if (contentDiv) {
          console.info('[豆瓣价格助手] 使用备用方案 #content');
          insertPriceCardBefore(contentDiv, isbn);
        } else {
          // 备用方案3: 在 #info 后面插入
          const infoDiv = document.getElementById('info');
          if (infoDiv && infoDiv.nextSibling) {
            console.info('[豆瓣价格助手] 使用备用方案：在 #info 后面插入');
            insertPriceCardBefore(infoDiv.nextSibling, isbn);
          } else if (infoDiv) {
            console.info('[豆瓣价格助手] 使用备用方案：在 #info 父元素末尾插入');
            infoDiv.parentNode.appendChild(createPriceCard(isbn));
          } else {
            // 列出所有可能的容器供调试
            const allDivs = document.querySelectorAll('div');
            const candidateDivs = [];
            allDivs.forEach(div => {
              if (div.className.includes('buyinfo') || div.className.includes('subject') || div.id) {
                candidateDivs.push({ id: div.id, className: div.className });
              }
            });
            console.info('[豆瓣价格助手] 候选容器列表:', candidateDivs);
            
            console.info('[豆瓣价格助手] 未找到任何插入位置');
          }
        }
      }
    }
  }

  // 从页面提取ISBN
  function extractISBN(infoDiv) {
    const html = infoDiv.innerHTML;

    // 匹配ISBN: 后面的数字
    const isbnMatch = html.match(/ISBN:\s*<\/span>\s*(\d[\d\-]+)/i);
    if (isbnMatch) {
      return isbnMatch[1].replace(/-/g, '');
    }

    // 备用方案：查找包含"ISBN"文本的span
    const spans = infoDiv.querySelectorAll('span.pl');
    for (const span of spans) {
      if (span.textContent.includes('ISBN')) {
        const nextNode = span.nextSibling;
        if (nextNode) {
          const text = nextNode.textContent || nextNode.nodeValue || '';
          const match = text.match(/(\d[\d\-]+)/);
          if (match) {
            return match[1].replace(/-/g, '');
          }
        }
      }
    }

    return null;
  }

  // 创建价格卡片元素
  function createPriceCard(isbn) {
    console.info('[豆瓣价格助手] 创建独立价格卡片，ISBN:', isbn);
    
    const cardContainer = document.createElement('div');
    cardContainer.className = 'gray_ad buyinfo price-card';
    cardContainer.id = 'secondhand-buyinfo';
    
    cardContainer.innerHTML = `
      <div class="buyinfo-printed">
        <h2>
          <span>当前版本二手书有售</span>
          &nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
        </h2>
        <ul class="bs current-version-list">
          <!-- 孔夫子旧书网 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="kongfz-link">
                    <span>孔网</span>
                  </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="kongfz-link">
                    <span class="buylink-price kongfz-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn kongfz-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 淘书网 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="taoshu-link">
                  <span>淘书网</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="taoshu-link">
                    <span class="buylink-price taoshu-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn taoshu-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 漫游鲸 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="manyou-link">
                  <span>漫游鲸</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="manyou-link">
                    <span class="buylink-price manyou-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn manyou-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 小谷吖 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a href="#" class="xiaoguya-link" style="cursor: pointer;">
                  <span>小谷吖</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a href="#" class="xiaoguya-link xiaoguya-price-wrapper" style="cursor: pointer;">
                    <span class="buylink-price xiaoguya-price" title="小谷吖价格需在小程序中查看">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" class="buy-book-btn paper-book-btn xiaoguya-link" style="cursor: pointer;">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 多抓鱼 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a href="#" class="duozhua-link" style="cursor: pointer;">
                  <span>多抓鱼</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a href="#" class="duozhua-link duozhua-price-wrapper" style="cursor: pointer;">
                    <span class="buylink-price duozhua-price" title="多抓鱼价格需在小程序中查看">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" class="buy-book-btn paper-book-btn duozhua-link" style="cursor: pointer;">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p style="text-align: center; color: #999; font-size: 13px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eaeaea;">Powered by <a href="https://douban-books-plus.pages.dev/" target="_blank" class="footer-link">Douban Book ++</a></p>
      </div>
    `;
    
    // 触发价格查询
    fetchKongfzPriceViaBackground(isbn)
      .then(kongfzData => {
        updateKongfzCard(cardContainer, kongfzData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取孔网价格失败:', error);
        const kongfzPrice = cardContainer.querySelector('.kongfz-price');
        if (kongfzPrice) kongfzPrice.textContent = '-';
      });

    fetchTaoshuPriceViaBackground(isbn)
      .then(taoshuData => {
        updateTaoshuCard(cardContainer, taoshuData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取淘书网价格失败:', error);
        const taoshuPrice = cardContainer.querySelector('.taoshu-price');
        if (taoshuPrice) taoshuPrice.textContent = '-';
      });

    fetchManyouPriceViaBackground(isbn)
      .then(manyouData => {
        updateManyouCard(cardContainer, manyouData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取漫游鲸价格失败:', error);
        const manyouPrice = cardContainer.querySelector('.manyou-price');
        if (manyouPrice) manyouPrice.textContent = '暂无数据';
      });
    
    // 初始化小谷吖卡片（设置价格提示）
    initXiaoguyaCard(cardContainer);
    
    // 绑定小谷吖点击事件
    bindXiaoguyaEvents(cardContainer, isbn);
    
    return cardContainer;
  }

  // 插入价格卡片到目标元素前面
  function insertPriceCardBefore(targetElement, isbn) {
    console.info('[豆瓣价格助手] 开始插入价格卡片，ISBN:', isbn);
    
    // 创建卡片容器
    const cardContainer = document.createElement('div');
    cardContainer.className = 'gray_ad buyinfo price-card';
    cardContainer.id = 'secondhand-buyinfo';
    console.info('[豆瓣价格助手] 创建卡片容器完成');

    // 初始加载状态
    cardContainer.innerHTML = `
      <div class="buyinfo-printed">
        <h2>
          <span>当前版本二手书有售</span>
          &nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·&nbsp;·
        </h2>
        <ul class="bs current-version-list">
          <!-- 孔夫子旧书网 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="kongfz-link">
                    <span>孔网</span>
                  </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="kongfz-link">
                    <span class="buylink-price kongfz-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn kongfz-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 淘书网 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="taoshu-link">
                  <span>淘书网</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="taoshu-link">
                    <span class="buylink-price taoshu-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn taoshu-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 漫游鲸 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a target="_blank" href="#" class="manyou-link">
                  <span>漫游鲸</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a target="_blank" href="#" class="manyou-link">
                    <span class="buylink-price manyou-price">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" target="_blank" class="buy-book-btn paper-book-btn manyou-link">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 小谷吖 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a href="#" class="xiaoguya-link" style="cursor: pointer;">
                  <span>小谷吖</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a href="#" class="xiaoguya-link xiaoguya-price-wrapper" style="cursor: pointer;">
                    <span class="buylink-price xiaoguya-price" title="小谷吖价格需在小程序中查看">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" class="buy-book-btn paper-book-btn xiaoguya-link" style="cursor: pointer;">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
          <!-- 多抓鱼 -->
          <li>
            <div class="cell price-btn-wrapper">
              <div class="vendor-name">
                <a href="#" class="duozhua-link" style="cursor: pointer;">
                  <span>多抓鱼</span>
                </a>
              </div>
              <div class="cell impression_track_mod_buyinfo">
                <div class="cell price-wrapper">
                  <a href="#" class="duozhua-link duozhua-price-wrapper" style="cursor: pointer;">
                    <span class="buylink-price duozhua-price" title="多抓鱼价格需在小程序中查看">--</span>
                  </a>
                </div>
                <div class="cell">
                  <a href="#" class="buy-book-btn paper-book-btn duozhua-link" style="cursor: pointer;">
                    <span>购买纸质书</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p style="text-align: center; color: #999; font-size: 13px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eaeaea;">Powered by <a href="https://douban-books-plus.pages.dev/" target="_blank" class="footer-link">Douban Book ++</a></p>
      </div>
    `;

    // 插入到目标元素之前
    targetElement.parentNode.insertBefore(cardContainer, targetElement);
    console.info('[豆瓣价格助手] 价格卡片已插入DOM');

    // 单独获取每个网站的价格，避免一个失败影响其他
    console.info('[豆瓣价格助手] 开始获取孔夫子价格');
    fetchKongfzPriceViaBackground(isbn)
      .then(kongfzData => {
        console.info('[豆瓣价格助手] 获取孔夫子价格成功:', kongfzData);
        updateKongfzCard(cardContainer, kongfzData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取孔网价格失败:', error);
      });

    console.info('[豆瓣价格助手] 开始获取淘书网价格');
    fetchTaoshuPriceViaBackground(isbn)
      .then(taoshuData => {
        console.info('[豆瓣价格助手] 获取淘书网价格成功:', taoshuData);
        updateTaoshuCard(cardContainer, taoshuData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取淘书网价格失败:', error);
      });

    console.info('[豆瓣价格助手] 开始获取漫游鲸价格');
    fetchManyouPriceViaBackground(isbn)
      .then(manyouData => {
        console.info('[豆瓣价格助手] 获取漫游鲸价格成功:', manyouData);
        updateManyouCard(cardContainer, manyouData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.warn('[豆瓣价格助手] 获取漫游鲸价格失败:', error);
        const manyouPrice = cardContainer.querySelector('.manyou-price');
        if (manyouPrice) manyouPrice.textContent = '暂无数据';
        // 设置链接跳转到漫游鲸主页
        const manyouLinks = cardContainer.querySelectorAll('.manyou-link');
        manyouLinks.forEach(link => {
          link.href = 'https://www.manyoujing.net/';
          link.target = '_blank';
        });
      });
    
    // 初始化小谷吖卡片（设置价格提示）
    console.info('[豆瓣价格助手] insertPriceCardBefore - 初始化小谷吖卡片');
    initXiaoguyaCard(cardContainer);
    
    // 绑定小谷吖点击事件
    console.info('[豆瓣价格助手] insertPriceCardBefore - 绑定小谷吖事件');
    bindXiaoguyaEvents(cardContainer, isbn);
    
    // 初始化多抓鱼卡片（设置价格提示）
    console.info('[豆瓣价格助手] insertPriceCardBefore - 初始化多抓鱼卡片');
    initDuozhuaCard(cardContainer, isbn);
    
    // 绑定多抓鱼点击事件
    console.info('[豆瓣价格助手] insertPriceCardBefore - 绑定多抓鱼事件');
    bindDuozhuaEvents(cardContainer, isbn);
    
    // 绑定漫游鲸平台名称 hover 事件
    console.info('[豆瓣价格助手] insertPriceCardBefore - 绑定漫游鲸平台名称事件');
    bindManyouVendorEvents(cardContainer);
  }

  // 查找并标记最低价格
  function findAndMarkLowestPrice(container) {
    const priceElements = [
      { selector: '.kongfz-price', getPrice: el => parseFloat(el.textContent) },
      { selector: '.taoshu-price', getPrice: el => parseFloat(el.textContent) },
      { selector: '.manyou-price', getPrice: el => parseFloat(el.textContent) }
    ];

    // 先清除所有元素的 lowest-price 类
    priceElements.forEach(item => {
      const el = container.querySelector(item.selector);
      if (el) {
        el.classList.remove('lowest-price');
      }
    });

    let lowestPrice = Infinity;
    let lowestElement = null;

    priceElements.forEach(item => {
      const el = container.querySelector(item.selector);
      if (el && el.textContent !== '--') {
        const price = item.getPrice(el);
        if (!isNaN(price) && price < lowestPrice) {
          lowestPrice = price;
          lowestElement = el;
        }
      }
    });

    if (lowestElement) {
      lowestElement.classList.add('lowest-price');
      console.info('[豆瓣价格助手] 最低价格已标记:', lowestElement.textContent);
    }
  }

  // 通过 Background Script 获取孔夫子价格
  async function fetchKongfzPriceViaBackground(isbn) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'fetchKongfzPrice',
          isbn: isbn,
          config: CONFIG
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || '未知错误'));
          }
        }
      );
    });
  }

  // 通过 Background Script 获取淘书网价格
  async function fetchTaoshuPriceViaBackground(isbn) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'fetchTaoshuPrice',
          isbn: isbn
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || '未知错误'));
          }
        }
      );
    });
  }

  // 通过 Background Script 获取漫游鲸价格
  async function fetchManyouPriceViaBackground(isbn) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'fetchManyouPrice',
          isbn: isbn
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || '未知错误'));
          }
        }
      );
    });
  }

  // 更新孔夫子卡片
  function updateKongfzCard(container, data, isbn, isCheapest) {
    const avgPriceYuan = data.avgPrice.toFixed(2);
    const searchUrl = `https://search.kongfz.com/product/?dataType=0&keyword=${isbn}&sortType=7&page=1&actionPath=sortType`;

    // 更新链接
    const links = container.querySelectorAll('.kongfz-link');
    links.forEach(link => link.href = searchUrl);

    // 更新价格
    const priceSpan = container.querySelector('.kongfz-price');
    if (priceSpan) {
      priceSpan.textContent = `${avgPriceYuan}元`;
      // 如果是最低价格，添加红色样式
      if (isCheapest) {
        priceSpan.classList.add('lowest-price');
      }
    }
  }

  // 更新淘书网卡片
  function updateTaoshuCard(container, data, isbn, isCheapest) {
    const salePriceYuan = data.salePrice.toFixed(2);
    const searchUrl = `https://www.taoshu.com/book?id=${data.bookID}`;

    // 更新链接
    const links = container.querySelectorAll('.taoshu-link');
    links.forEach(link => link.href = searchUrl);

    // 更新价格
    const priceSpan = container.querySelector('.taoshu-price');
    if (priceSpan) {
      priceSpan.textContent = `${salePriceYuan}元`;
      // 如果是最低价格，添加红色样式
      if (isCheapest) {
        priceSpan.classList.add('lowest-price');
      }
    }
  }

  // 检查元素是否在DOM中
  function checkElementInDOM(selector, name) {
    const el = document.querySelector(selector);
    const isInDOM = el && document.body.contains(el);
    console.info(`[豆瓣价格助手] 检查 ${name} 是否在DOM中: ${isInDOM}`, el);
    return isInDOM;
  }

  // 更新漫游鲸卡片
  function updateManyouCard(container, data, isbn, isCheapest) {
    console.info('[豆瓣价格助手] updateManyouCard - 开始更新漫游鲸卡片');
    console.info('[豆瓣价格助手] updateManyouCard - 容器:', container);
    console.info('[豆瓣价格助手] updateManyouCard - 容器是否在DOM中:', document.body.contains(container));
    console.info('[豆瓣价格助手] updateManyouCard - 数据:', data);
    
    // 更新前检查
    checkElementInDOM('.manyou-price', 'manyou-price');
    
    // 使用 sellPrice 而不是 mixSellPrice（用户反馈正确价格字段是 sellPriceStr）
    const salePriceYuan = data.sellPrice.toFixed(2);
    // 直接使用ISBN搜索的URL
    const searchUrl = `https://www.manyoujing.net/?keyword=${isbn}&searchType=isbn`;

    // 更新链接
    const links = container.querySelectorAll('.manyou-link');
    console.info('[豆瓣价格助手] updateManyouCard - 找到 manyou-link 数量:', links.length);
    links.forEach(link => link.href = searchUrl);

    // 更新价格
    const priceSpan = container.querySelector('.manyou-price');
    console.info('[豆瓣价格助手] updateManyouCard - 找到 manyou-price:', priceSpan);
    
    if (priceSpan) {
      priceSpan.textContent = `${salePriceYuan}元`;
      console.info('[豆瓣价格助手] updateManyouCard - 价格已更新为:', `${salePriceYuan}元`);
      
      // 如果是最低价格，添加红色样式
      if (isCheapest) {
        priceSpan.classList.add('lowest-price');
      }
    } else {
      console.warn('[豆瓣价格助手] updateManyouCard - 未找到 manyou-price 元素');
    }
    
    // 更新后检查
    setTimeout(() => {
      checkElementInDOM('.manyou-price', 'manyou-price (更新后)');
      checkElementInDOM('.secondhand-buyinfo', 'secondhand-buyinfo (更新后)');
    }, 100);
    
    console.info('[豆瓣价格助手] updateManyouCard - 更新完成');
  }

  // 初始化小谷吖卡片
  function initXiaoguyaCard(container) {
    console.info('[豆瓣价格助手] initXiaoguyaCard - 初始化小谷吖卡片');
    const priceSpan = container.querySelector('.xiaoguya-price');
    if (priceSpan) {
      priceSpan.innerHTML = '<span class="xiaoguya-price-text">扫码查看</span>';
    }
  }

  // 初始化多抓鱼卡片
  function initDuozhuaCard(container, isbn) {
    console.info('[豆瓣价格助手] initDuozhuaCard - 初始化多抓鱼卡片');
    
    const searchUrl = `https://www.duozhuayu.com/search/book/${isbn}`;
    
    // 设置价格为点击查看，点击跳转
    const priceSpan = container.querySelector('.duozhua-price');
    if (priceSpan) {
      priceSpan.innerHTML = `<a href="${searchUrl}" target="_blank" class="duozhua-price-link">点击查看</a>`;
    }
    
    // 设置购买链接
    const buyLinks = container.querySelectorAll('.duozhua-link');
    buyLinks.forEach(link => {
      link.href = searchUrl;
      link.target = '_blank';
    });
  }

  // 绑定小谷吖事件
  function bindXiaoguyaEvents(container, isbn) {
    console.info('[豆瓣价格助手] bindXiaoguyaEvents - 绑定小谷吖事件，ISBN:', isbn);
    console.info('[豆瓣价格助手] bindXiaoguyaEvents - 容器:', container);
    
    // 查找小谷吖购买按钮
    const buyButtons = container.querySelectorAll('.xiaoguya-link.paper-book-btn');
    console.info('[豆瓣价格助手] bindXiaoguyaEvents - 找到 xiaoguya-link.paper-book-btn 数量:', buyButtons.length);
    
    // 为购买按钮绑定 hover 事件
    buyButtons.forEach((button, index) => {
      console.info('[豆瓣价格助手] bindXiaoguyaEvents - 绑定 hover 事件到第', index + 1, '个购买按钮');
      button.addEventListener('mouseenter', (e) => {
        e.preventDefault();
        console.info('[豆瓣价格助手] hover 小谷吖购买按钮，目标:', e.target);
        showXiaoguyaQrcodeModal(e.target, isbn);
      });
      button.addEventListener('mouseleave', (e) => {
        console.info('[豆瓣价格助手] mouseleave 小谷吖购买按钮');
        hideQrcodeModal();
      });
      // 阻止默认点击行为
      button.addEventListener('click', (e) => {
        e.preventDefault();
      });
    });
    
    // 查找小谷吖平台名称链接
    const vendorLinks = container.querySelectorAll('.vendor-name .xiaoguya-link');
    console.info('[豆瓣价格助手] bindXiaoguyaEvents - 找到 vendor-name .xiaoguya-link 数量:', vendorLinks.length);
    
    // 为平台名称绑定 hover 事件（也弹出二维码）
    vendorLinks.forEach((link, index) => {
      console.info('[豆瓣价格助手] bindXiaoguyaEvents - 绑定 hover 事件到第', index + 1, '个平台名称链接');
      link.addEventListener('mouseenter', (e) => {
        e.preventDefault();
        console.info('[豆瓣价格助手] hover 小谷吖平台名称，目标:', e.target);
        showXiaoguyaQrcodeModal(e.target, isbn);
      });
      link.addEventListener('mouseleave', (e) => {
        console.info('[豆瓣价格助手] mouseleave 小谷吖平台名称');
        hideQrcodeModal();
      });
      // 阻止默认点击行为
      link.addEventListener('click', (e) => {
        e.preventDefault();
      });
    });
    
    // 绑定价格区域的 hover 事件（弹出二维码）
    const priceWrapper = container.querySelector('.xiaoguya-price-wrapper');
    console.info('[豆瓣价格助手] bindXiaoguyaEvents - 找到 xiaoguya-price-wrapper:', priceWrapper);
    
    if (priceWrapper) {
      priceWrapper.addEventListener('mouseenter', (e) => {
        console.info('[豆瓣价格助手] hover 小谷吖价格区域，目标:', e.target);
        showXiaoguyaQrcodeModal(e.target, isbn);
      });
      priceWrapper.addEventListener('mouseleave', (e) => {
        console.info('[豆瓣价格助手] mouseleave 小谷吖价格区域');
        hideQrcodeModal();
      });
      console.info('[豆瓣价格助手] bindXiaoguyaEvents - 已绑定价格区域 hover 事件（弹出二维码）');
    } else {
      console.warn('[豆瓣价格助手] bindXiaoguyaEvents - 未找到 xiaoguya-price-wrapper');
    }
  }

  // 绑定多抓鱼事件
  function bindDuozhuaEvents(container, isbn) {
    console.info('[豆瓣价格助手] bindDuozhuaEvents - 绑定多抓鱼事件，ISBN:', isbn);
    console.info('[豆瓣价格助手] bindDuozhuaEvents - 容器:', container);
    
    const searchUrl = `https://www.duozhuayu.com/search/book/${isbn}`;
    
    // 平台名称 hover 弹出二维码
    const vendorLinks = container.querySelectorAll('.vendor-name .duozhua-link');
    console.info('[豆瓣价格助手] bindDuozhuaEvents - 找到 vendor-name .duozhua-link 数量:', vendorLinks.length);
    vendorLinks.forEach((link, index) => {
      link.addEventListener('mouseenter', (e) => {
        e.preventDefault();
        console.info('[豆瓣价格助手] hover 多抓鱼平台名称，目标:', e.target);
        showDuozhuaQrcodeModal(e.target, isbn);
      });
      link.addEventListener('mouseleave', (e) => {
        console.info('[豆瓣价格助手] mouseleave 多抓鱼平台名称');
        hideQrcodeModal();
      });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(searchUrl, '_blank');
      });
    });
    
    console.info('[豆瓣价格助手] bindDuozhuaEvents - 多抓鱼事件绑定完成');
  }

  // 绑定漫游鲸平台名称事件
  function bindManyouVendorEvents(container) {
    console.info('[豆瓣价格助手] bindManyouVendorEvents - 绑定漫游鲸平台名称事件');
    
    // 平台名称 hover 弹出二维码
    const vendorLinks = container.querySelectorAll('.vendor-name .manyou-link');
    console.info('[豆瓣价格助手] bindManyouVendorEvents - 找到 vendor-name .manyou-link 数量:', vendorLinks.length);
    
    vendorLinks.forEach((link, index) => {
      const originalHref = link.href;
      link.addEventListener('mouseenter', (e) => {
        e.preventDefault();
        console.info('[豆瓣价格助手] hover 漫游鲸平台名称，目标:', e.target);
        showManyouQrcodeModal(e.target, null);
      });
      link.addEventListener('mouseleave', (e) => {
        console.info('[豆瓣价格助手] mouseleave 漫游鲸平台名称');
        hideQrcodeModal('manyou-qrcode-modal');
      });
      // 点击时跳转
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(originalHref, '_blank');
      });
    });
    
    console.info('[豆瓣价格助手] bindManyouVendorEvents - 漫游鲸事件绑定完成');
  }

  // 显示小谷吖提示框
  function showXiaoguyaTooltip(e) {
    console.info('[豆瓣价格助手] 显示小谷吖 hover 提示');
    // 先移除已存在的 tooltip
    hideXiaoguyaTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'xiaoguya-tooltip';
    tooltip.id = 'xiaoguya-tooltip';
    tooltip.textContent = '小谷吖价格需在小程序中查看';
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 20}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    // 触发动画
    setTimeout(() => {
      tooltip.classList.add('show');
    }, 10);
    
    // 给 tooltip 本身添加 mouseleave 事件
    tooltip.addEventListener('mouseleave', hideXiaoguyaTooltip);
  }

  // 隐藏小谷吖提示框
  function hideXiaoguyaTooltip() {
    console.info('[豆瓣价格助手] 隐藏小谷吖 hover 提示');
    const tooltip = document.getElementById('xiaoguya-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
      setTimeout(() => {
        tooltip.remove();
      }, 200);
    }
  }

  // 显示多抓鱼提示框
  function showDuozhuaTooltip(e) {
    console.info('[豆瓣价格助手] 显示多抓鱼 hover 提示');
    // 先移除已存在的 tooltip
    hideDuozhuaTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'xiaoguya-tooltip';
    tooltip.id = 'duozhua-tooltip';
    tooltip.textContent = '点击购买查看价格';
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 20}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(tooltip);
    
    // 触发动画
    setTimeout(() => {
      tooltip.classList.add('show');
    }, 10);
    
    // 给 tooltip 本身添加 mouseleave 事件
    tooltip.addEventListener('mouseleave', hideDuozhuaTooltip);
  }

  // 隐藏多抓鱼提示框
  function hideDuozhuaTooltip() {
    console.info('[豆瓣价格助手] 隐藏多抓鱼 hover 提示');
    const tooltip = document.getElementById('duozhua-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
      setTimeout(() => {
        tooltip.remove();
      }, 200);
    }
  }

  // 创建小谷吖二维码弹窗
  function createXiaoguyaQrcodeModal() {
    console.info('[豆瓣价格助手] createXiaoguyaQrcodeModal - 创建小谷吖二维码弹窗');
    const modal = document.createElement('div');
    modal.className = 'qrcode-modal-overlay';
    modal.id = 'xiaoguya-qrcode-modal';
    
    // 使用 chrome.runtime.getURL 获取正确的资源路径
    const wechatQrcodeUrl = chrome.runtime.getURL('images/xiaoguya_wechat.png');
    const alipayQrcodeUrl = chrome.runtime.getURL('images/xiaoguya_alipay.png');
    console.info('[豆瓣价格助手] createXiaoguyaQrcodeModal - 微信二维码URL:', wechatQrcodeUrl);
    console.info('[豆瓣价格助手] createXiaoguyaQrcodeModal - 支付宝二维码URL:', alipayQrcodeUrl);
    
    modal.innerHTML = `
      <div class="qrcode-modal-content">
        <div class="qrcode-container">
          <div class="qrcode-item">
            <img src="${wechatQrcodeUrl}" alt="微信" class="qrcode-image">
            <div class="qrcode-label">微信</div>
          </div>
          <div class="qrcode-item">
            <img src="${alipayQrcodeUrl}" alt="支付宝" class="qrcode-image">
            <div class="qrcode-label">支付宝</div>
          </div>
        </div>
      </div>
    `;
    
    return modal;
  }

  // 创建多抓鱼二维码弹窗
  function createDuozhuaQrcodeModal() {
    console.info('[豆瓣价格助手] createDuozhuaQrcodeModal - 创建多抓鱼二维码弹窗');
    const modal = document.createElement('div');
    modal.className = 'qrcode-modal-overlay';
    modal.id = 'duozhua-qrcode-modal';
    
    // 多抓鱼只有微信二维码
    const wechatQrcodeUrl = chrome.runtime.getURL('images/duozhuayu_wechat.png');
    console.info('[豆瓣价格助手] createDuozhuaQrcodeModal - 微信二维码URL:', wechatQrcodeUrl);
    
    modal.innerHTML = `
      <div class="qrcode-modal-content">
        <div class="qrcode-container">
          <div class="qrcode-item">
            <img src="${wechatQrcodeUrl}" alt="微信" class="qrcode-image">
            <div class="qrcode-label">微信</div>
          </div>
        </div>
      </div>
    `;
    
    return modal;
  }

  // 创建漫游鲸二维码弹窗
  function createManyouQrcodeModal() {
    console.info('[豆瓣价格助手] createManyouQrcodeModal - 创建漫游鲸二维码弹窗');
    const modal = document.createElement('div');
    modal.className = 'qrcode-modal-overlay';
    modal.id = 'manyou-qrcode-modal';
    
    // 漫游鲸二维码
    const manyouQrcodeUrl = chrome.runtime.getURL('images/manyoujing_wechat.png');
    console.info('[豆瓣价格助手] createManyouQrcodeModal - 漫游鲸二维码URL:', manyouQrcodeUrl);
    
    modal.innerHTML = `
      <div class="qrcode-modal-content">
        <div class="qrcode-container">
          <div class="qrcode-item">
            <img src="${manyouQrcodeUrl}" alt="漫游鲸" class="qrcode-image">
            <div class="qrcode-label">漫游鲸</div>
          </div>
        </div>
      </div>
    `;
    
    return modal;
  }

  // 显示小谷吖二维码弹窗
  function showXiaoguyaQrcodeModal(button, isbn) {
    console.info('[豆瓣价格助手] showXiaoguyaQrcodeModal - 显示小谷吖二维码弹窗，ISBN:', isbn);
    // 先隐藏多抓鱼弹窗
    hideQrcodeModal('duozhua-qrcode-modal');
    
    let modal = document.getElementById('xiaoguya-qrcode-modal');
    if (!modal) {
      modal = createXiaoguyaQrcodeModal();
      document.body.appendChild(modal);
    }
    
    // 设置弹窗位置在按钮上方
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      modal.style.left = buttonRect.left + 'px';
      modal.style.top = (buttonRect.top - 280) + 'px';
      modal.style.position = 'fixed';
    }
    
    modal.classList.add('show');
  }

  // 显示多抓鱼二维码弹窗
  function showDuozhuaQrcodeModal(button, isbn) {
    console.info('[豆瓣价格助手] showDuozhuaQrcodeModal - 显示多抓鱼二维码弹窗，ISBN:', isbn);
    // 先隐藏小谷吖弹窗
    hideQrcodeModal('xiaoguya-qrcode-modal');
    
    let modal = document.getElementById('duozhua-qrcode-modal');
    if (!modal) {
      modal = createDuozhuaQrcodeModal();
      document.body.appendChild(modal);
    }
    
    // 设置弹窗位置在按钮上方
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      modal.style.left = buttonRect.left + 'px';
      modal.style.top = (buttonRect.top - 280) + 'px';
      modal.style.position = 'fixed';
    }
    
    modal.classList.add('show');
  }

  // 显示漫游鲸二维码弹窗
  function showManyouQrcodeModal(button, isbn) {
    console.info('[豆瓣价格助手] showManyouQrcodeModal - 显示漫游鲸二维码弹窗');
    // 先隐藏其他弹窗
    hideQrcodeModal('xiaoguya-qrcode-modal');
    hideQrcodeModal('duozhua-qrcode-modal');
    
    let modal = document.getElementById('manyou-qrcode-modal');
    if (!modal) {
      modal = createManyouQrcodeModal();
      document.body.appendChild(modal);
    }
    
    // 设置弹窗位置在按钮上方
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      modal.style.left = buttonRect.left + 'px';
      modal.style.top = (buttonRect.top - 280) + 'px';
      modal.style.position = 'fixed';
    }
    
    modal.classList.add('show');
  }

  // 隐藏二维码弹窗
  function hideQrcodeModal(modalId = 'xiaoguya-qrcode-modal') {
    console.info('[豆瓣价格助手] hideQrcodeModal - 隐藏二维码弹窗:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
    }
    // 同时隐藏其他弹窗
    const otherModalIds = ['xiaoguya-qrcode-modal', 'duozhua-qrcode-modal', 'manyou-qrcode-modal'].filter(id => id !== modalId);
    otherModalIds.forEach(id => {
      const otherModal = document.getElementById(id);
      if (otherModal) {
        otherModal.classList.remove('show');
      }
    });
  }
})();
