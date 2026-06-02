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
    // 检查是否在图书详情页
    const infoDiv = document.getElementById('info');
    if (!infoDiv) {
      console.log('[豆瓣价格助手] 未找到图书信息区域');
      return;
    }

    const isbn = extractISBN(infoDiv);
    if (!isbn) {
      console.log('[豆瓣价格助手] 未找到ISBN');
      return;
    }

    console.log('[豆瓣价格助手] 找到ISBN:', isbn);

    // 查找插入位置 - 插入到 buyinfo 前面
    const buyInfoDiv = document.getElementById('buyinfo');
    if (buyInfoDiv) {
      insertPriceCardBefore(buyInfoDiv, isbn);
    } else {
      // 备用方案
      const subjectDiv = document.getElementById('subject');
      if (subjectDiv) {
        insertPriceCardBefore(subjectDiv, isbn);
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

  // 插入价格卡片到目标元素前面
  function insertPriceCardBefore(targetElement, isbn) {
    // 创建卡片容器
    const cardContainer = document.createElement('div');
    cardContainer.className = 'gray_ad buyinfo price-card';
    cardContainer.id = 'secondhand-buyinfo';

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
        </ul>
        <p style="text-align: center; color: #999; font-size: 13px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eaeaea;">Powered by <a href="https://douban-books-plus.pages.dev/" target="_blank" class="footer-link">Douban Book ++</a></p>
      </div>
    `;

    // 插入到目标元素之前
    targetElement.parentNode.insertBefore(cardContainer, targetElement);

    // 并行获取两个网站的价格
    Promise.all([
      fetchKongfzPriceViaBackground(isbn),
      fetchTaoshuPriceViaBackground(isbn)
    ]).then(([kongfzData, taoshuData]) => {
      // 比较价格，标记最低价格
      const kongfzPrice = kongfzData.avgPrice;
      const taoshuPrice = taoshuData.salePrice;
      const kongfzIsCheaper = kongfzPrice < taoshuPrice;
      
      updateKongfzCard(cardContainer, kongfzData, isbn, kongfzIsCheaper);
      updateTaoshuCard(cardContainer, taoshuData, isbn, !kongfzIsCheaper);
    }).catch(error => {
      console.error('[豆瓣价格助手] 获取价格失败:', error);
    });
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
})();
