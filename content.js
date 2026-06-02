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
      });

    fetchTaoshuPriceViaBackground(isbn)
      .then(taoshuData => {
        updateTaoshuCard(cardContainer, taoshuData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取淘书网价格失败:', error);
      });

    fetchManyouPriceViaBackground(isbn)
      .then(manyouData => {
        updateManyouCard(cardContainer, manyouData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取漫悠悠价格失败:', error);
      });
    
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

    console.info('[豆瓣价格助手] 开始获取漫悠悠价格');
    fetchManyouPriceViaBackground(isbn)
      .then(manyouData => {
        console.info('[豆瓣价格助手] 获取漫悠悠价格成功:', manyouData);
        updateManyouCard(cardContainer, manyouData, isbn, false);
        findAndMarkLowestPrice(cardContainer);
      })
      .catch(error => {
        console.error('[豆瓣价格助手] 获取漫悠悠价格失败:', error);
      });
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

  // 通过 Background Script 获取漫悠悠价格
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

  // 更新漫悠悠卡片
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
})();
