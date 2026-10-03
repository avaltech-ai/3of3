/**
 * 桃子腳幼兒園 諾貝爾 A 班 - GAS 專屬班級網頁後端
 * 試算表 ID: 1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU
 * Albums 資料夾 ID: 1iRFAr3FZMqV-okmktipdwamjAR7WWp6d
 * Docs 資料夾 ID: 1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR
 */

const SPREADSHEET_ID = '1lFRlvwQgo_B38YmtFD9BHqyGvuGstOK7etu3RO_BqQU';
const ALBUMS_FOLDER_ID = '1iRFAr3FZMqV-okmktipdwamjAR7WWp6d';
const DOCS_FOLDER_ID = '1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR';
const ACTIVITY_FOLDER_ID = '1EKWV3ASXIttVtud1f_pfl672MkEfwa8b2';

/**
 * 取得或自動建立 Google Drive 中的 Acticity 資料夾
 * 優先讀取 Settings 設定或上層資料夾，並確保連結有效避免 404
 */
function getActivityFolder() {
  let customId = '';
  try {
    const ss = getSpreadsheet();
    if (ss) {
      const setSheet = ss.getSheetByName('Settings');
      if (setSheet) {
        const settings = getSettingsObject(setSheet);
        customId = settings.ACTIVITY_FOLDER_ID || '';
      }
    }
  } catch (e) {
    console.warn('Cannot read Settings for ACTIVITY_FOLDER_ID: ' + e);
  }

  // 1. 若後台設定有提供指定 ID 且有效，直接使用
  if (customId) {
    try {
      const folder = DriveApp.getFolderById(customId);
      if (folder) return folder;
    } catch (e) {
      console.warn('Custom ACTIVITY_FOLDER_ID not found, auto searching: ' + e);
    }
  }

  // 2. 嘗試使用常數預設 ID
  if (ACTIVITY_FOLDER_ID) {
    try {
      const folder = DriveApp.getFolderById(ACTIVITY_FOLDER_ID);
      if (folder) return folder;
    } catch (e) {}
  }

  // 3. 自動在相簿 (Albums) 資料夾的上一層尋找名為 Acticity 或 Activity 或 Spotlight 的資料夾
  try {
    const albumsFolder = DriveApp.getFolderById(ALBUMS_FOLDER_ID);
    const parents = albumsFolder.getParents();
    if (parents.hasNext()) {
      const parent = parents.next();
      const subfolders = parent.getFolders();
      while (subfolders.hasNext()) {
        const sub = subfolders.next();
        const n = sub.getName().toLowerCase();
        if (n === 'acticity' || n === 'activity' || n === 'spotlight') {
          return sub;
        }
      }
      // 若該層尚無此資料夾，自動在同層建立 Acticity 資料夾並開啟檢視權限
      const created = parent.createFolder('Acticity');
      try {
        created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      return created;
    }
  } catch (e) {
    console.warn('Cannot search/create under Albums parent: ' + e);
  }

  // 4. 根目錄搜尋或建立備援
  try {
    const fs = DriveApp.getFoldersByName('Acticity');
    if (fs.hasNext()) return fs.next();
    const created = DriveApp.createFolder('Acticity');
    try {
      created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}
    return created;
  } catch (e) {
    console.warn('Root create Acticity failed: ' + e);
  }

  return null;
}


/**
 * 試算表自訂選單（開啟 Google 試算表時自動載入）
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🌟 諾貝爾A班專屬功能')
      .addItem('🚀 一鍵初始化／重設資料庫 (5大工作表與示範資料)', 'setupInitialDatabase')
      .addItem('🌐 開啟班級網頁應用程式', 'openWebApp')
      .addToUi();
  } catch (e) {
    console.warn('onOpen UI menu creation skipped: ' + e);
  }
}

function openWebApp() {
  const url = 'https://script.google.com/macros/s/AKfycbxhp0gicx82NNCI58dNmoceEfTUCldZ9Eqp9Uh4zOOGU6vXeowbZuO9DmqDcvG62PLRkQ/exec';
  const html = '<div style="font-family:sans-serif;padding:16px;text-align:center;">' +
    '<h3 style="color:#E05362;margin-bottom:12px;">🍑 諾貝爾 A 班生活網</h3>' +
    '<p style="font-size:13px;color:#666;margin-bottom:16px;">網頁已部署完成，點擊下方按鈕即可開啟！</p>' +
    '<a href="' + url + '" target="_blank" style="display:inline-block;padding:10px 22px;background:#FF7A85;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;box-shadow:0 2px 6px rgba(255,122,133,0.4);">👉 開啟班級生活網</a>' +
    '</div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(380).setHeight(180), '諾貝爾 A 班生活網');
}

/**
 * Web App 入口 (支援 HTML 網頁呈現與 REST API JSON 回應)
 */
function doGet(e) {
  // 如果帶有 action 參數，則作為 REST API 回傳 JSON（支援 GitHub Pages 跨網域讀取）
  if (e && e.parameter && e.parameter.action) {
    let result = { success: false, error: '未知動作' };
    const action = e.parameter.action;
    try {
      if (action === 'getAppData') {
        result = getAppData();
      } else if (action === 'getAlbums') {
        result = getAlbums();
      } else if (action === 'getAlbumPhotos') {
        result = getAlbumPhotos(e.parameter.albumId);
      } else if (action === 'getActivityImages') {
        result = getActivityImages();
      } else if (action === 'setupInitialDatabase') {
        result = setupInitialDatabase();
      }
    } catch (err) {
      result = { success: false, error: err.toString() };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 自動檢查資料庫是否已初始化，未初始化則自動建立
  try {
    ensureDatabaseInitialized();
  } catch (err) {
    console.error('Database initialization check failed: ' + err.toString());
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('桃子腳幼兒園 - 諾貝爾 A 班')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setFaviconUrl('https://img.icons8.com/color/48/school.png');
}

/**
 * REST API POST 入口（支援 google.script.run 內部呼叫、GitHub Pages 跨域 iframe form 呼叫）
 */
function doPost(e) {
  let isFormMode = false;
  try {
    let postData = {};

    // 優先檢查 form 表單欄位 'payload'（來自 GitHub Pages 隱藏 iframe form 提交）
    if (e && e.parameter && e.parameter.payload) {
      postData = JSON.parse(e.parameter.payload);
      isFormMode = true;
    } else if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    const action = postData.action;
    let result = { success: false, error: '未知 POST 動作' };

    if (action === 'verifyPassword') {
      result = verifyPassword(postData.password);
    } else if (action === 'saveEvent') {
      result = saveEvent(postData.data, postData.password);
    } else if (action === 'deleteEvent') {
      result = deleteEvent(postData.id, postData.password);
    } else if (action === 'saveMenu') {
      result = saveMenu(postData.data, postData.password);
    } else if (action === 'deleteMenu') {
      result = deleteMenu(postData.date, postData.password);
    } else if (action === 'saveSpotlight') {
      result = saveSpotlight(postData.data, postData.password);
    } else if (action === 'deleteSpotlight') {
      result = deleteSpotlight(postData.id, postData.password);
    } else if (action === 'updateSpotlightsOrder') {
      result = updateSpotlightsOrder(postData.orderList, postData.password);
    } else if (action === 'uploadPhotosToAlbum') {
      result = uploadPhotosToAlbum(postData.date, postData.title, postData.files, postData.password);
    } else if (action === 'uploadDocument') {
      result = uploadDocument(postData.meta, postData.file, postData.password);
    } else if (action === 'uploadSpotlightImage') {
      result = uploadSpotlightImage(postData.file, postData.password);
    } else if (action === 'getActivityImages') {
      result = getActivityImages();
    } else if (action === 'saveDoc') {
      result = saveDoc(postData.docData || postData.data, postData.password);
    } else if (action === 'deleteDoc') {
      result = deleteDoc(postData.id || postData.docId, postData.password);
    } else if (action === 'updateSettings') {
      result = updateSettings(postData.settings, postData.password);
    } else if (action === 'setupInitialDatabase') {
      result = setupInitialDatabase();
    }

    // 若為 form 模式（來自 GitHub Pages iframe），回傳帶有 postMessage 的 HTML 頁面
    if (isFormMode) {
      const resultJson = JSON.stringify(result).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
        '<script>try{window.top.postMessage(' + resultJson + ',"*");}catch(e){}try{window.parent.postMessage(' + resultJson + ',"*");}catch(e){}try{window.parent.parent.postMessage(' + resultJson + ',"*");}catch(e){}</script>' +
        '</body></html>';
      return HtmlService.createHtmlOutput(html)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const errResult = JSON.stringify({ success: false, error: err.toString() });
    if (isFormMode) {
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
        '<script>try{window.top.postMessage(' + errResult.replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + ',"*");}catch(e){}try{window.parent.postMessage(' + errResult.replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + ',"*");}catch(e){}try{window.parent.parent.postMessage(' + errResult.replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + ',"*");}catch(e){}</script>' +
        '</body></html>';
      return HtmlService.createHtmlOutput(html)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    return ContentService.createTextOutput(errResult)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 取得試算表實例
 */
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID) {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    console.warn('Cannot open by SPREADSHEET_ID, falling back to active spreadsheet: ' + e);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 清除 getAppData 雲端快取，確保寫入時立即生效
 */
function clearAppDataCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove('app_data_v2');
  } catch (e) {}
}

/**
 * 取得前台初始化所需的全部資料（一次取得，加速前端渲染）
 */
function getAppData() {
  try {
    // 1. 優先嘗試讀取快取（大幅降低延遲至 0.2s，避免前端久候）
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get('app_data_v2');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    const ss = getSpreadsheet();
    if (!ss) throw new Error('無法開啟 Google 試算表');

    ensureDatabaseInitialized();

    // 自動移轉 Events 欄位：將 category 改為 categoryMajor，並在右側插入 categoryMinor
    let evtSheet = ss.getSheetByName('Events');
    if (evtSheet) {
      let headers = evtSheet.getDataRange().getValues()[0] || [];
      let catIndex = headers.indexOf('category');
      let catMajorIndex = headers.indexOf('categoryMajor');
      let catMinorIndex = headers.indexOf('categoryMinor');
      
      if (catIndex > -1 && catMajorIndex === -1) {
        // 把原本的 category 改名為 categoryMajor
        evtSheet.getRange(1, catIndex + 1).setValue('categoryMajor');
        
        // 如果沒有 categoryMinor，就插在 categoryMajor 旁邊
        if (catMinorIndex === -1) {
          evtSheet.insertColumnAfter(catIndex + 1);
          evtSheet.getRange(1, catIndex + 2).setValue('categoryMinor');
        }
      }

      // 檢查並自動修復曾因舊版程式欄位位移的 EV-14
      let allEvtValues = evtSheet.getDataRange().getValues();
      if (allEvtValues.length > 1) {
        let curHeaders = allEvtValues[0].map(h => String(h).trim());
        let idCol = curHeaders.indexOf('id');
        let catMajCol = curHeaders.indexOf('categoryMajor');
        let catMinCol = curHeaders.indexOf('categoryMinor');
        let timeCol = curHeaders.indexOf('timeLocation');
        let descCol = curHeaders.indexOf('description');
        if (idCol > -1 && catMinCol > -1 && timeCol > -1) {
          for (let r = 1; r < allEvtValues.length; r++) {
            if (String(allEvtValues[r][idCol]) === 'EV-14') {
              let minVal = String(allEvtValues[r][catMinCol]);
              if (minVal.includes(':') || minVal.includes('10:00')) {
                evtSheet.getRange(r + 1, catMajCol + 1).setValue('班級主題');
                evtSheet.getRange(r + 1, catMinCol + 1).setValue('幸福廚房');
                evtSheet.getRange(r + 1, timeCol + 1).setValue('10:00 至 12:20');
                evtSheet.getRange(r + 1, descCol + 1).setValue('🌟 諾 A 班十月份幸福廚房手作日！');
              }
            }
          }
        }
      }
    }

    const events = getSheetDataAsObjects(ss.getSheetByName('Events'));
    const menus = getSheetDataAsObjects(ss.getSheetByName('Menus'));
    const spotlights = getSheetDataAsObjects(ss.getSheetByName('Spotlight'));
    const docs = getSheetDataAsObjects(ss.getSheetByName('Docs'));
    const settings = getSettingsObject(ss.getSheetByName('Settings'));

    // 確保 DocCategories 工作表存在
    let docCatSheet = ss.getSheetByName('DocCategories');
    if (!docCatSheet) {
      docCatSheet = ss.insertSheet('DocCategories');
      docCatSheet.appendRow(['categoryName']);
      docCatSheet.getRange(1, 1, 1, 1).setFontWeight('bold').setBackground('#E0E7FF');
      const defaultCats = [
        ['全部文件'],
        ['保健用藥'],
        ['學期行事曆'],
        ['餐飲菜單'],
        ['親師手冊']
      ];
      docCatSheet.getRange(2, 1, defaultCats.length, 1).setValues(defaultCats);
    }
    const docCategories = getSheetDataAsObjects(docCatSheet).map(row => row.categoryName).filter(Boolean);

    // 確保 EventTargets 工作表存在
    let evTargetSheet = ss.getSheetByName('EventTargets');
    if (!evTargetSheet) {
      evTargetSheet = ss.insertSheet('EventTargets');
      evTargetSheet.appendRow(['targetName', 'displayName']);
      evTargetSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E0E7FF');
      const defaultTargets = [
        ['諾貝爾A班', '🌟 諾貝爾 A 班專屬'],
        ['全園', '🏫 全園活動'],
        ['親職活動', '👨‍👩‍👧 親師座談 / 親職活動'],
        ['米A/米B/兩果', '米A/米B/兩果'],
        ['雨奧/奧斯卡/諾奧', '雨奧/奧斯卡/諾奧'],
        ['其他', '其他班級']
      ];
      evTargetSheet.getRange(2, 1, defaultTargets.length, 2).setValues(defaultTargets);
    }
    const eventTargets = getSheetDataAsObjects(evTargetSheet).filter(row => row.targetName);

    // 確保 EventCategories 工作表存在 (大項)
    let evCatSheet = ss.getSheetByName('EventCategories');
    if (!evCatSheet) {
      evCatSheet = ss.insertSheet('EventCategories');
      evCatSheet.appendRow(['categoryName']);
      evCatSheet.getRange(1, 1, 1, 1).setFontWeight('bold').setBackground('#E0E7FF');
      const defaultCats = [
        ['重要活動'],
        ['班級主題'],
        ['親職講座'],
        ['全園活動'],
        ['節慶放假'],
        ['園務消毒']
      ];
      evCatSheet.getRange(2, 1, defaultCats.length, 1).setValues(defaultCats);
    }
    const eventCategoriesMajor = getSheetDataAsObjects(evCatSheet).map(row => row.categoryName).filter(Boolean);
    
    // 確保 EventCategoriesMinor 工作表存在 (細項)
    let evCatMinorSheet = ss.getSheetByName('EventCategoriesMinor');
    if (!evCatMinorSheet) {
      evCatMinorSheet = ss.insertSheet('EventCategoriesMinor');
      evCatMinorSheet.appendRow(['categoryName']);
      evCatMinorSheet.getRange(1, 1, 1, 1).setFontWeight('bold').setBackground('#E0E7FF');
      const defaultCatsMinor = [
        ['幸福廚房'],
        ['慶生活動'],
        ['戶外踏訪'],
        ['高峰活動'],
        ['歲末活動']
      ];
      evCatMinorSheet.getRange(2, 1, defaultCatsMinor.length, 1).setValues(defaultCatsMinor);
    }
    const eventCategoriesMinor = getSheetDataAsObjects(evCatMinorSheet).map(row => row.categoryName).filter(Boolean);



    let actFolderUrl = '';
    let actFolderId = '';
    try {
      const actFolder = getActivityFolder();
      if (actFolder) {
        actFolderUrl = actFolder.getUrl();
        actFolderId = actFolder.getId();
      }
    } catch (e) {
      console.warn('Get activity folder for getAppData failed: ' + e);
    }

    const result = {
      success: true,
      data: {
        events: events || [],
        menus: menus || [],
        spotlights: spotlights || [],
        docs: docs || [],
        docCategories: docCategories || [],
        eventTargets: eventTargets || [],
        eventCategoriesMajor: eventCategoriesMajor || [],
        eventCategoriesMinor: eventCategoriesMinor || [],
        settings: {
          className: settings.CLASS_NAME || '諾貝爾 A 班',
          kindergartenName: settings.KINDERGARTEN_NAME || '桃子腳幼兒園',
          albumsFolderId: settings.ALBUMS_FOLDER_ID || ALBUMS_FOLDER_ID,
          docsFolderId: settings.DOCS_FOLDER_ID || DOCS_FOLDER_ID,
          activityFolderId: actFolderId || settings.ACTIVITY_FOLDER_ID || '',
          activityFolderUrl: actFolderUrl || ('https://drive.google.com/drive/folders/' + (actFolderId || ALBUMS_FOLDER_ID)),
          tickerMessage: settings.TICKER_MESSAGE || '歡迎光臨諾貝爾 A 班！請隨時關注今日活動與營養美味菜單～'
        }
      }
    };
    try {
      const cache = CacheService.getScriptCache();
      cache.put('app_data_v2', JSON.stringify(result), 300); // 快取 5 分鐘
    } catch (e) {}
    return result;
  } catch (err) {
    return {
      success: false,
      error: err.toString()
    };
  }
}

/**
 * 取得相簿清單（讀取 Albums 資料夾中的子資料夾）
 */
function getAlbums() {
  try {
    const folder = DriveApp.getFolderById(ALBUMS_FOLDER_ID);
    const subFolders = folder.getFolders();
    const albumList = [];

    while (subFolders.hasNext()) {
      const subFolder = subFolders.next();
      const folderName = subFolder.getName();
      const folderId = subFolder.getId();
      const files = subFolder.getFiles();

      let photoCount = 0;
      let coverUrl = '';

      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();
        if (mimeType.indexOf('image/') === 0) {
          photoCount++;
          if (!coverUrl) {
            // 使用 Drive 預覽/展示圖網址
            coverUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w600';
          }
        }
      }

      // 解析資料夾名稱（格式：YYYY-MM-DD_主題 或 YYYYMMDD_主題）
      let date = '';
      let title = folderName;
      if (folderName.indexOf('_') > -1) {
        const parts = folderName.split('_');
        date = parts[0];
        title = parts.slice(1).join('_');
      }

      albumList.push({
        id: folderId,
        folderName: folderName,
        date: date,
        title: title,
        photoCount: photoCount,
        coverUrl: coverUrl,
        folderUrl: subFolder.getUrl(),
        createdTime: subFolder.getDateCreated().toISOString()
      });
    }

    // 依日期或建立時間由新到舊排序
    albumList.sort((a, b) => (b.date || b.folderName).localeCompare(a.date || a.folderName));

    return {
      success: true,
      albums: albumList
    };
  } catch (err) {
    return {
      success: false,
      error: '讀取活動相簿時發生錯誤: ' + err.toString(),
      albums: []
    };
  }
}

/**
 * 取得特定相簿內的所有相片
 */
function getAlbumPhotos(albumFolderId) {
  try {
    const folder = DriveApp.getFolderById(albumFolderId);
    const files = folder.getFiles();
    const photos = [];

    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      if (mime.indexOf('image/') === 0) {
        photos.push({
          id: file.getId(),
          name: file.getName(),
          size: file.getSize(),
          thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800',
          viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
        });
      }
    }

    return {
      success: true,
      folderName: folder.getName(),
      photos: photos
    };
  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      photos: []
    };
  }
}

/**
 * 上傳多張照片至 Albums 資料夾
 * 自動建立「YYYY-MM-DD_主題」子資料夾
 */
function uploadPhotosToAlbum(dateStr, titleStr, filesArray, password) {
  if (!checkPassword(password)) {
    return { success: false, error: '管理員密碼錯誤！' };
  }

  try {
    if (!dateStr || !titleStr || !filesArray || filesArray.length === 0) {
      return { success: false, error: '請提供上傳日期、活動主題及至少一張照片！' };
    }

    const folderName = `${dateStr}_${titleStr}`;
    const rootFolder = DriveApp.getFolderById(ALBUMS_FOLDER_ID);

    // 尋找是否已有同名子資料夾，若無則新建
    let targetFolder;
    const subFolders = rootFolder.getFoldersByName(folderName);
    if (subFolders.hasNext()) {
      targetFolder = subFolders.next();
    } else {
      targetFolder = rootFolder.createFolder(folderName);
      try {
        targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        console.warn('Set sharing error: ' + e);
      }
    }

    let uploadCount = 0;
    for (let i = 0; i < filesArray.length; i++) {
      const f = filesArray[i];
      const decodedBytes = Utilities.base64Decode(f.base64);
      const blob = Utilities.newBlob(decodedBytes, f.mimeType || 'image/jpeg', f.name || `photo_${i + 1}.jpg`);
      const newFile = targetFolder.createFile(blob);
      try {
        newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
      uploadCount++;
    }

    return {
      success: true,
      message: `成功上傳 ${uploadCount} 張照片至相簿「${folderName}」！`,
      folderId: targetFolder.getId(),
      folderName: folderName
    };
  } catch (err) {
    return {
      success: false,
      error: '上傳照片失敗: ' + err.toString()
    };
  }
}

/**
 * 上傳文件至 Docs 資料夾並登記至 Docs 試算表
 */
function uploadDocument(docMeta, fileObj, password) {
  if (!checkPassword(password)) {
    return { success: false, error: '管理員密碼錯誤！' };
  }

  try {
    const rootFolder = DriveApp.getFolderById(DOCS_FOLDER_ID);
    const decodedBytes = Utilities.base64Decode(fileObj.base64);
    const blob = Utilities.newBlob(decodedBytes, fileObj.mimeType || 'application/pdf', fileObj.name);
    const newFile = rootFolder.createFile(blob);
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    const fileId = newFile.getId();
    const downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');

    const docData = {
      id: docMeta.id || ('DOC-' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMddHHmmss')),
      fileName: docMeta.fileName || fileObj.name,
      category: docMeta.category || '一般文件',
      description: docMeta.description || '',
      driveFileId: fileId,
      downloadUrl: downloadUrl,
      updatedAt: todayStr
    };

    const saveResult = saveDoc(docData, password);
    if (!saveResult.success) {
      throw new Error(saveResult.error);
    }

    return {
      success: true,
      message: '文件已成功上傳並發佈！',
      fileId: fileId,
      downloadUrl: downloadUrl,
      docId: docData.id
    };
  } catch (err) {
    return {
      success: false,
      error: '上傳文件失敗: ' + err.toString()
    };
  }
}

/**
 * 上傳 Spotlight 圖片至 Google Drive Acticity 資料夾
 */
function uploadSpotlightImage(fileObj, password) {
  if (!checkPassword(password)) {
    return { success: false, error: '管理員密碼錯誤！' };
  }

  try {
    const folder = getActivityFolder();
    if (!folder) throw new Error('無法取得或建立 Google Drive Acticity 資料夾！');

    const decodedBytes = Utilities.base64Decode(fileObj.base64);
    const fileName = fileObj.name || ('Spotlight_' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd_HHmmss') + '.jpg');
    const blob = Utilities.newBlob(decodedBytes, fileObj.mimeType || 'image/jpeg', fileName);
    const newFile = folder.createFile(blob);
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      console.warn('Set sharing failed: ' + e);
    }

    const fileId = newFile.getId();
    // 使用 Drive 高解析度縮圖網址 (sz=w1600)，可直接於 <img> 標籤無障礙顯示
    const imageUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';

    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      imageUrl: imageUrl,
      folderUrl: folder.getUrl(),
      message: 'Spotlight 圖片已成功上傳至 Google Drive 的 Acticity 資料夾！'
    };
  } catch (err) {
    return {
      success: false,
      error: '上傳 Spotlight 圖片至 Acticity 資料夾失敗: ' + err.toString()
    };
  }
}

/**
 * 取得 Google Drive Acticity 資料夾內現有的所有圖片檔案
 */
function getActivityImages() {
  try {
    const folder = getActivityFolder();
    if (!folder) return { success: false, error: '找不到或無法開啟 Acticity 資料夾', files: [] };

    const files = folder.getFiles();
    const list = [];
    while (files.hasNext()) {
      const f = files.next();
      const mime = f.getMimeType();
      if (mime.indexOf('image/') === 0) {
        list.push({
          id: f.getId(),
          name: f.getName(),
          imageUrl: 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w1600',
          viewUrl: f.getUrl(),
          updatedAt: Utilities.formatDate(f.getLastUpdated(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm')
        });
      }
    }
    return { success: true, folderUrl: folder.getUrl(), files: list };
  } catch (err) {
    return { success: false, error: '讀取 Acticity 資料夾失敗: ' + err.toString(), files: [] };
  }
}

/**
 * 驗證管理員密碼
 */
function verifyPassword(password) {
  const isValid = checkPassword(password);
  return { success: isValid, message: isValid ? '驗證成功' : '密碼不正確' };
}

function checkPassword(password) {
  if (!password) return false;
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Settings');
    const settings = getSettingsObject(sheet);
    const realPassword = settings.ADMIN_PASSWORD || 'nobel-a-2026';
    return String(password).trim() === String(realPassword).trim();
  } catch (e) {
    return password === 'nobel-a-2026';
  }
}

/**
 * 儲存/編輯 行事曆活動
 */
function saveEvent(eventData, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Events');
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());

    const idIndex = headers.indexOf('id');
    const id = eventData.id || ('EV-' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMddHHmmss'));

    const fieldMap = {
      id: id,
      date: eventData.date || '',
      endDate: eventData.endDate || '',
      title: eventData.title || '',
      target: eventData.target || '全園',
      categoryMajor: eventData.categoryMajor || eventData.category || '全園活動',
      categoryMinor: eventData.categoryMinor || '',
      timeLocation: eventData.timeLocation || '',
      description: eventData.description || '',
      theme: eventData.theme || ''
    };
    // 舊版單一 category 欄位相容
    if (headers.indexOf('category') > -1 && headers.indexOf('categoryMajor') === -1) {
      fieldMap['category'] = eventData.categoryMajor || eventData.category || '全園活動';
    }

    const rowData = headers.map(h => fieldMap[h] !== undefined ? fieldMap[h] : (eventData[h] !== undefined ? eventData[h] : ''));

    let foundRow = -1;
    if (eventData.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]) === String(eventData.id)) {
          foundRow = i + 1;
          break;
        }
      }
    }

    if (foundRow > -1) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    clearAppDataCache();
    return { success: true, message: '活動已儲存成功！' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 刪除行事曆活動
 */
function deleteEvent(eventId, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Events');
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(eventId)) {
        sheet.deleteRow(i + 1);
        clearAppDataCache();
        return { success: true, message: '活動已成功刪除！' };
      }
    }
    return { success: false, error: '找不到該活動編號' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 儲存/編輯 當日菜單
 */
function saveMenu(menuData, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Menus');
    const data = sheet.getDataRange().getValues();
    const dateIndex = data[0].indexOf('date');

    const rowData = [
      menuData.date || '',
      menuData.morningSnack || '',
      menuData.fruit || '',
      menuData.lunchStaple || '',
      menuData.lunchMain || '',
      menuData.lunchSide1 || '',
      menuData.lunchSide2 || '',
      menuData.lunchSoup || '',
      menuData.afternoonSnack || '',
      menuData.nutrients || '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類',
      menuData.note || ''
    ];

    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const cellDate = normalizeDateString(data[i][dateIndex]);
      if (cellDate === menuData.date) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > -1) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    clearAppDataCache();
    return { success: true, message: '菜單已儲存成功！' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 刪除當日菜單
 */
function deleteMenu(dateStr, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Menus');
    const data = sheet.getDataRange().getValues();
    const dateIndex = data[0].indexOf('date');

    for (let i = 1; i < data.length; i++) {
      if (normalizeDateString(data[i][dateIndex]) === dateStr) {
        sheet.deleteRow(i + 1);
        clearAppDataCache();
        return { success: true, message: '菜單已成功刪除！' };
      }
    }
    return { success: false, error: '找不到該日期菜單' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 確保 Spotlight 工作表包含所有必要欄位（相容舊版資料庫）
 */
function ensureSpotlightSheetHeaders(sheet) {
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const required = ['id', 'title', 'subtitle', 'imageUrl', 'mediaType', 'tags', 'bulletPoints', 'startDate', 'endDate', 'duration', 'priority', 'status'];
  if (data.length === 0 || !data[0] || data[0].length === 0) {
    sheet.appendRow(required);
    sheet.getRange(1, 1, 1, required.length).setFontWeight('bold').setBackground('#CCFBF1');
    return;
  }
  const headers = data[0].map(h => String(h).trim());
  let added = false;
  required.forEach(col => {
    if (headers.indexOf(col) === -1) {
      sheet.getRange(1, headers.length + 1).setValue(col);
      headers.push(col);
      added = true;
    }
  });
  if (added) {
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  const pCol = headers.indexOf('priority');
  if (pCol > -1 && sheet.getLastRow() > 1) {
    sheet.getRange(2, pCol + 1, sheet.getLastRow() - 1, 1).setNumberFormat('0');
  }
}

/**
 * 儲存/編輯 Spotlight 重點活動（支援排程、秒數、多活動）
 */
function saveSpotlight(spData, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Spotlight');
    if (!sheet) sheet = ss.insertSheet('Spotlight');
    ensureSpotlightSheetHeaders(sheet);

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const idIndex = headers.indexOf('id');

    const id = spData.id || ('SP-' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMddHHmmss'));
    const fieldMap = {
      id: id,
      title: spData.title || '',
      subtitle: spData.subtitle || '',
      imageUrl: spData.imageUrl || '',
      mediaType: spData.mediaType || 'image',
      tags: spData.tags || '',
      bulletPoints: spData.bulletPoints || '',
      startDate: spData.startDate || '',
      endDate: spData.endDate || '',
      duration: Number(spData.duration) || 5,
      priority: spData.priority || 1,
      status: spData.status || '啟用'
    };

    const rowData = headers.map(h => fieldMap[h] !== undefined ? fieldMap[h] : (spData[h] !== undefined ? spData[h] : ''));

    let foundRow = -1;
    if (spData.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]) === String(spData.id)) {
          foundRow = i + 1;
          break;
        }
      }
    }

    if (foundRow > -1) {
      sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    clearAppDataCache();
    return { success: true, message: 'Spotlight 重點活動儲存成功！', id: id };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 刪除 Spotlight
 */
function deleteSpotlight(spId, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Spotlight');
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(spId)) {
        sheet.deleteRow(i + 1);
        clearAppDataCache();
        return { success: true, message: 'Spotlight 已成功刪除！' };
      }
    }
    return { success: false, error: '找不到該 Spotlight 編號' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 批次更新 Spotlight 輪播順序
 */
function updateSpotlightsOrder(orderList, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Spotlight');
    if (!sheet) return { success: false, error: '找不到 Spotlight 工作表' };
    ensureSpotlightSheetHeaders(sheet);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, message: '無資料需更新' };

    const headers = data[0].map(h => String(h).trim());
    const idIndex = headers.indexOf('id');
    const priorityIndex = headers.indexOf('priority');
    if (idIndex === -1 || priorityIndex === -1) {
      return { success: false, error: '找不到 id 或 priority 欄位' };
    }

    const orderMap = {};
    if (Array.isArray(orderList)) {
      orderList.forEach(item => {
        if (item && item.id) {
          orderMap[String(item.id)] = Number(item.priority) || 1;
        }
      });
    }

    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][idIndex]);
      if (orderMap[rowId] !== undefined) {
        const cell = sheet.getRange(i + 1, priorityIndex + 1);
        cell.setNumberFormat('0');
        cell.setValue(orderMap[rowId]);
      }
    }

    // 將 Spotlight 工作表依 priority (第 priorityIndex + 1 欄) 升冪排序
    if (data.length > 2) {
      sheet.getRange(2, 1, data.length - 1, headers.length).sort({ column: priorityIndex + 1, ascending: true });
    }

    clearAppDataCache();
    return { success: true, message: 'Spotlight 輪播順序已成功更新！' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 儲存/更新常用文件紀錄 (支援前台即時編輯與雲端同步)
 */
function saveDoc(docData, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Docs');
    if (!sheet) sheet = ss.insertSheet('Docs');

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(function(h) { return String(h).trim(); });
    const idIndex = headers.indexOf('id');
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');

    const id = docData.id || ('DOC-' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMddHHmmss'));
    const fieldMap = {
      id: id,
      fileName: docData.fileName || '',
      category: docData.category || '一般文件',
      description: docData.description || '',
      driveFileId: docData.driveFileId || '',
      downloadUrl: docData.downloadUrl || '',
      updatedAt: docData.updatedAt || todayStr
    };

    let targetRow = -1;
    if (idIndex !== -1) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]) === String(id)) {
          targetRow = i + 1;
          break;
        }
      }
    }

    if (targetRow > -1) {
      headers.forEach(function(h, colIdx) {
        if (fieldMap[h] !== undefined) {
          sheet.getRange(targetRow, colIdx + 1).setValue(fieldMap[h]);
        }
      });
      clearAppDataCache();
      return { success: true, message: '文件資訊已成功更新！' };
    } else {
      const newRow = headers.map(function(h) { return fieldMap[h] !== undefined ? fieldMap[h] : ''; });
      sheet.appendRow(newRow);
      clearAppDataCache();
      return { success: true, message: '新文件已成功加入清單！' };
    }
  } catch (err) {
    return { success: false, error: '儲存文件失敗: ' + err.toString() };
  }
}

/**
 * 刪除文件紀錄
 */
function deleteDoc(docId, password) {
  if (!checkPassword(password)) return { success: false, error: '管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Docs');
    const data = sheet.getDataRange().getValues();
    const idIndex = data[0].indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(docId)) {
        sheet.deleteRow(i + 1);
        clearAppDataCache();
        return { success: true, message: '文件已成功自清單移除！' };
      }
    }
    return { success: false, error: '找不到該文件編號' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * 更新系統設定（含管理員密碼、跑馬燈文字）
 */
function updateSettings(newSettings, password) {
  if (!checkPassword(password)) return { success: false, error: '目前管理員密碼錯誤！' };
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Settings');
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      if (newSettings[key] !== undefined) {
        sheet.getRange(i + 1, 2).setValue(newSettings[key]);
      }
    }

    clearAppDataCache();
    return { success: true, message: '系統設定已更新完成！' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

// -------------------------------------------------------------
// 資料庫初始化與輔助工具函式
// -------------------------------------------------------------

function ensureDatabaseInitialized() {
  const ss = getSpreadsheet();
  if (!ss) return;

  const eventsSheet = ss.getSheetByName('Events');
  if (!eventsSheet || eventsSheet.getLastRow() <= 1) {
    setupInitialDatabase();
  }
}

function normalizeDateString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Taipei', 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  // 若只有日期數字 1~31，補上年份月份
  if (/^\d{1,2}$/.test(str)) {
    const d = ('0' + str).slice(-2);
    return '2026-10-' + d;
  }
  return str.replace(/\//g, '-');
}

function getSheetDataAsObjects(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const list = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // 空行略過
    if (!row[0] && !row[1] && !row[3]) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      let val = row[j];
      if (val instanceof Date) {
        if (header === 'priority' || header === 'duration') {
          const epoch = new Date(1899, 11, 30);
          const diffDays = Math.round((val.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
          val = diffDays > 0 ? diffDays : 1;
        } else {
          val = Utilities.formatDate(val, 'Asia/Taipei', 'yyyy-MM-dd');
        }
      }
      obj[header] = val;
    }
    list.push(obj);
  }
  return list;
}

function getSettingsObject(sheet) {
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0]).trim();
    const val = values[i][1];
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}

/**
 * 一鍵初始化試算表資料庫結構與預設示範資料
 */
function setupInitialDatabase() {
  const ss = getSpreadsheet();
  if (!ss) throw new Error('無法取得 Google 試算表！');

  // 1. Events 工作表
  let eventsSheet = ss.getSheetByName('Events');
  if (!eventsSheet) eventsSheet = ss.insertSheet('Events');
  eventsSheet.clear();
  eventsSheet.appendRow(['id', 'date', 'endDate', 'title', 'target', 'categoryMajor', 'categoryMinor', 'timeLocation', 'description', 'theme']);
  eventsSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#FEE2E2');

  const sampleEvents = [
    ['EV-01', '2026-08-03', '', '新學期開學日', '全園', '全園活動', '', '', '新學期開始，歡迎所有小朋友回到幼兒園！', '快樂上學趣'],
    ['EV-02', '2026-08-21', '', '八月壽星慶生', '全園', '全園活動', '', '', '祝福八月份小壽星生日快樂！', '快樂上學趣'],
    ['EV-03', '2026-08-25', '', '米羅 A、B、雨果班親師座談', '米羅/雨果', '親職活動', '', '17:00 開始', '各班親師座談，屆時視狀況調整實體或線上辦理', '快樂上學趣'],
    ['EV-04', '2026-08-26', '', '雨奧、奧斯卡、諾奧親師座談', '雨奧/奧斯卡/諾奧', '親職活動', '', '17:00 開始', '各班親師座談，屆時視狀況調整實體或線上辦理', '快樂上學趣'],
    ['EV-05', '2026-08-27', '', '諾貝爾 A、B、C 親師座談', '諾貝爾A班', '親職活動', '', '17:00 開始', '🌟 諾貝爾 A 班親師座談，誠摯邀請家長共同參與！', '快樂上學趣'],
    ['EV-06', '2026-09-07', '', '幸福廚房（米A/米B/兩果）', '米A/米B/兩果', '班級主題', '', '', '幸福廚房手作生活體驗', '快樂上學趣'],
    ['EV-07', '2026-09-08', '', '幸福廚房（雨奧/奧斯卡/諾奧）', '雨奧/奧斯卡/諾奧', '班級主題', '', '', '幸福廚房手作生活體驗', '快樂上學趣'],
    ['EV-08', '2026-09-09', '', '幸福廚房（諾C/諾B/諾A）', '諾貝爾A班', '班級主題', '', '', '🌟 諾 A 班今日輪到幸福廚房體驗！化身小小烘焙師！', '快樂上學趣'],
    ['EV-09', '2026-09-11', '', '九月壽星慶生', '全園', '全園活動', '', '', '九月份壽星慶祝活動', '快樂上學趣'],
    ['EV-10', '2026-09-24', '', '社區親職講座：感覺統合輕鬆練習', '全園', '親職講座', '', '19:00-21:00', '講師：潘宇賢職能治療師（菇菇老師）', '快樂上學趣'],
    ['EV-11', '2026-09-25', '2026-09-28', '中秋節／教師節連假', '全園', '節慶放假', '', '連假四日', '連假期間請注意幼兒居家安全與作息健康', '快樂上學趣'],
    ['EV-12', '2026-10-05', '', '幸福廚房（米A/米B/兩果）', '米A/米B/兩果', '班級主題', '', '', '幸福廚房手作生活體驗', '主題活動：人與自己／人與他人概念'],
    ['EV-13', '2026-10-06', '', '幸福廚房（雨奧/奧斯卡/諾奧）', '雨奧/奧斯卡/諾奧', '班級主題', '', '', '幸福廚房手作生活體驗', '主題活動：人與自己／人與他人概念'],
    ['EV-14', '2026-10-07', '', '幸福廚房（諾C/諾B/諾A）', '諾貝爾A班', '班級主題', '', '', '🌟 諾 A 班十月份幸福廚房手作日！', '主題活動：人與自己／人與他人概念'],
    ['EV-15', '2026-10-08', '', '十月壽星慶生會', '全園', '全園活動', '', '', '十月份小壽星慶生會，分享快樂分享愛！', '主題活動：人與自己／人與他人概念'],
    ['EV-16', '2026-10-09', '2026-10-11', '雙十節連假', '全園', '節慶放假', '', '連假三日', '國慶連續假期放假三日', '主題活動：人與自己／人與他人概念'],
    ['EV-17', '2026-10-23', '', '牙齒塗氟日 口腔保健檢查', '諾貝爾A班', '重要活動', '', '08:30 (五)', '🌟 全園定期塗氟檢查，請家長務必攜帶健保卡！未攜帶無法參加喔！', '主題活動：人與自己／人與他人概念'],
    ['EV-18', '2026-10-24', '2026-10-26', '光復節連假', '全園', '節慶放假', '', '連假三日', '光復節連續假期放假三日', '主題活動：人與自己／人與他人概念'],
    ['EV-19', '2026-11-04', '', '幸福廚房（諾C/諾B/諾A）', '諾貝爾A班', '班級主題', '', '', '🌟 諾 A 班十一月份幸福廚房手作活動', '主題活動：人與自己／人與他人概念'],
    ['EV-20', '2026-11-12', '', '社區親職講座：找回孩子的專注力', '全園', '親職講座', '', '19:00-21:00 (線上)', '講師：廖笙光（光光老師），歡迎家長踴躍線上參與', '主題活動：人與自己／人與他人概念'],
    ['EV-21', '2026-11-13', '', '十一月壽星慶生', '全園', '全園活動', '', '', '十一月份壽星慶祝活動', '主題活動：人與自己／人與他人概念'],
    ['EV-22', '2026-11-20', '', '緊急傷病宣導及演練 / 感恩節闖關活動', '全園', '全園活動', '', '放學時間', '宣導防護演練，放學時間舉行溫馨感恩節闖關活動！', '主題活動：人與自己／人與他人概念'],
    ['EV-23', '2026-12-02', '', '幸福廚房（諾C/諾B/諾A）', '諾貝爾A班', '班級主題', '', '', '🌟 諾 A 班十二月份幸福廚房體驗', '主題活動：冬令月'],
    ['EV-24', '2026-12-18', '', '十二月壽星慶生會', '全園', '全園活動', '', '', '十二月份壽星慶祝活動', '主題活動：冬令月'],
    ['EV-25', '2026-12-21', '2026-12-31', '學期高峰活動週', '全園', '重要活動', '', '全週進行', '全園學期主題高峰成果發表週', '主題活動：冬令月'],
    ['EV-26', '2026-12-25', '2026-12-27', '行憲紀念日連假', '全園', '節慶放假', '', '連假三日', '連假三日放假', '主題活動：冬令月'],
    ['EV-27', '2027-01-01', '', '元旦假期放假', '全園', '節慶放假', '', '放假一日', '新年元旦假期放假一日', '冬令月'],
    ['EV-28', '2027-01-08', '', '一月壽星慶生 / 全園性歲末活動', '全園', '全園活動', '', '', '一月壽星慶祝與歲末團聚溫馨活動', '冬令月'],
    ['EV-29', '2027-01-25', '2027-01-29', '全園消毒日', '全園', '園務消毒', '', '全園消毒', '學期末全園環境深層清潔與消毒作業', '冬令月']
  ];
  eventsSheet.getRange(2, 1, sampleEvents.length, 10).setValues(sampleEvents);

  // 2. Menus 工作表
  let menusSheet = ss.getSheetByName('Menus');
  if (!menusSheet) menusSheet = ss.insertSheet('Menus');
  menusSheet.clear();
  menusSheet.appendRow(['date', 'morningSnack', 'fruit', 'lunchStaple', 'lunchMain', 'lunchSide1', 'lunchSide2', 'lunchSoup', 'afternoonSnack', 'nutrients', 'note']);
  menusSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#FEF3C7');

  const sampleMenus = [
    ['2026-10-01', '紅藜雙色饅頭、米漿', '當季水果', '糙白米飯', '青椒炒雞柳', '木須炒蛋', '有機蔬菜', '玉米濃湯', '滑蛋雞肉粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', '本園未使用主管機關公告之不合格油品'],
    ['2026-10-02', '全麥吐司、黑芝麻豆漿', '當季水果', '日式和風拉麵', '有機蔬菜', '蘿蔔貢丸湯', '', '', '豆花', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-05', '奶皇包、黑芝麻豆漿', '當季水果', '古早味滷肉飯', '有機蔬菜', '什錦蔬菜湯', '', '', '鹹粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-06', '芋頭堅果饅頭、燕麥豆漿', '當季水果', '糙白米飯', '什錦冬粉', '番茄豆腐', '有機蔬菜', '營養蔬菜湯', '綠豆薏仁湯', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-07', '什錦穀片、鮮奶', '當季水果', '糙白米飯', '瓜仔肉', '蛋香大黃瓜', '有機蔬菜', '魚丸湯', '芋頭粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-08', '果醬吐司、豆漿', '當季水果', '味噌豬肉湯麵', '有機蔬菜', '', '', '', '慶生會點心', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', '今日十月壽星慶生會'],
    ['2026-10-12', '鮮果穀片、鮮奶', '當季水果', '美味水餃', '有機蔬菜', '紫菜蛋花湯', '', '', '薑絲魚片粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-13', '乳酪捲、黑芝麻豆漿', '當季水果', '糙白米飯', '三杯菇菇', '玉米炒蛋', '有機蔬菜', '青菜豆腐湯', '米苔目甜湯', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-14', '葡萄吐司、燕麥豆漿', '當季水果', '糙白米飯', '冬瓜燒肉', '開陽白菜', '有機蔬菜', '肉羹湯', '關東煮', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-15', '黑糖雙色饅頭、豆漿', '當季水果', '糙白米飯', '洋蔥炒雞肉', '小黃瓜炒豆腐', '有機蔬菜', '番茄蛋花湯', '地瓜西米露', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-16', '小菠蘿餐包、米漿', '當季水果', '茄汁豬肉燉飯', '有機蔬菜', '蒜頭雞湯', '', '', '台式米粉', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-19', '豆沙包、燕麥豆漿', '當季水果', '蔬菜雞肉蓋飯', '有機蔬菜', '鮮菇湯', '', '', '仙草蜜', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-20', '原味穀片、鮮奶', '當季水果', '糙白米飯', '塔香豆腐', '鮮菇炒時蔬', '有機蔬菜', '海帶芽湯', '香菇玉米粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-21', '奶油麵包、豆漿', '當季水果', '糙白米飯', '蔥爆雞絲', '芹香麵腸', '有機蔬菜', '香菇雞湯', '紅豆湯', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-22', '銀絲卷、黑芝麻豆漿', '當季水果', '糙白米飯', '糖醋里肌', '家常滷味', '有機蔬菜', '馬鈴薯蘿蔔湯', '陽春麵', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-23', '鹹奶油餐包、米漿', '當季水果', '日式炒烏龍', '有機蔬菜', '味噌湯', '', '', '桂圓燕麥粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', '今日塗氟檢查日'],
    ['2026-10-27', '玉米穀片、鮮奶', '當季水果', '田園蛋炒飯', '有機蔬菜', '青菜豆腐湯', '', '', '玉米香菇粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-28', '紅豆麵包、豆漿', '當季水果', '糙白米飯', '紅燒雞丁', '青蔥炒蛋', '有機蔬菜', '火腿豆腐湯', '絲瓜冬粉湯', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-29', '鮮奶饅頭、燕麥豆漿', '當季水果', '糙白米飯', '絞肉炒三丁', '香菇燴絲瓜', '有機蔬菜', '金針湯', '地瓜甜湯', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', ''],
    ['2026-10-30', '芝麻包、米漿', '當季水果', '沙茶拌麵', '有機蔬菜', '冬瓜湯', '', '', '吻仔魚粥', '全穀雜糧類,豆魚蛋肉類,蔬菜類,水果類', '']
  ];
  menusSheet.getRange(2, 1, sampleMenus.length, 11).setValues(sampleMenus);

  // 3. Spotlight 工作表
  let spSheet = ss.getSheetByName('Spotlight');
  if (!spSheet) spSheet = ss.insertSheet('Spotlight');
  spSheet.clear();
  spSheet.appendRow(['id', 'title', 'subtitle', 'imageUrl', 'mediaType', 'tags', 'bulletPoints', 'startDate', 'endDate', 'duration', 'priority', 'status']);
  spSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#CCFBF1');

  const sampleSpotlights = [
    [
      'SP-01',
      '桃子腳幼兒園 牙齒塗氟日 活動攻略圖',
      '日期：2026/10/23 (五) 08:30 起全園分班檢查',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
      'image',
      '口腔衛教,牙齒塗氟,重要提醒',
      '【衛教宣導】正確刷牙示範，養成潔牙好習慣！\n【塗氟檢查】每六個月定期口腔保健，保護小乳牙！\n【注意事項】請家長務必攜帶「健保卡」，未攜帶無法參加喔！\n【活動尾聲】守護健康小乳牙，順利完成打卡領小禮物！',
      '2026-10-01',
      '2026-10-31',
      6,
      1,
      '啟用'
    ],
    [
      'SP-02',
      '幼兒園幸福廚房手作生活體驗',
      '日期：2026/10/07 (三) 諾貝爾 A 班手作日',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
      'image',
      '幸福廚房,手作烘焙,生活自理',
      '【生活自理】引導幼兒親手揉捏麵糰、體驗食材變化與手作樂趣。\n【小組合作】學習分工收拾餐具與桌面，培養分享與責任感！\n【親師叮嚀】當日請幫孩子穿著輕便服裝與圍裙，準備開心化身小小烘焙師！',
      '2026-10-01',
      '2026-10-20',
      5,
      2,
      '啟用'
    ]
  ];
  spSheet.getRange(2, 1, sampleSpotlights.length, 12).setValues(sampleSpotlights);

  // 4. Docs 工作表
  let docsSheet = ss.getSheetByName('Docs');
  if (!docsSheet) docsSheet = ss.insertSheet('Docs');
  docsSheet.clear();
  docsSheet.appendRow(['id', 'fileName', 'category', 'description', 'driveFileId', 'downloadUrl', 'updatedAt']);
  docsSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E0E7FF');

  const sampleDocs = [
    ['DOC-01', '幼兒用藥委託單.pdf', '保健用藥', '若幼兒當日需要委託老師餵藥，請家長下載列印填妥簽名後連同藥品一併交由老師。', '', 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', '2026-09-01'],
    ['DOC-02', '115學年度(上)全園活動規劃暨親職活動行事曆.pdf', '學期行事曆', '115學年度上學期完整行事曆，包含親師座談、幸福廚房排程與各連假公告。', '', 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', '2026-08-01'],
    ['DOC-03', '10月份營養午餐及點心菜單表.pdf', '餐飲菜單', '桃子腳幼兒園10月份每日早午點、當季水果與午餐五菜一湯明細。', '', 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', '2026-10-01'],
    ['DOC-04', '諾貝爾A班作息與入園須知手冊.pdf', '親師手冊', '包含諾貝爾A班每日晨間作息、生活自理引導與接送注意事項。', '', 'https://drive.google.com/drive/folders/1Ie8medB2JPYdUA9LOryVnPAdko1t5rjR', '2026-08-15']
  ];
  docsSheet.getRange(2, 1, sampleDocs.length, 7).setValues(sampleDocs);

  // 5. Settings 工作表
  let setSheet = ss.getSheetByName('Settings');
  if (!setSheet) setSheet = ss.insertSheet('Settings');
  setSheet.clear();
  setSheet.appendRow(['key', 'value', 'description']);
  setSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#F3F4F6');

  const sampleSettings = [
    ['ADMIN_PASSWORD', 'nobel-a-2026', '後台管理員登入密碼（可於後台直接更改）'],
    ['CLASS_NAME', '諾貝爾 A 班', '班級名稱'],
    ['KINDERGARTEN_NAME', '桃子腳幼兒園', '幼兒園全名'],
    ['ALBUMS_FOLDER_ID', ALBUMS_FOLDER_ID, '相簿根目錄 Google Drive 資料夾 ID'],
    ['DOCS_FOLDER_ID', DOCS_FOLDER_ID, '文件根目錄 Google Drive 資料夾 ID'],
    ['ACTIVITY_FOLDER_ID', ACTIVITY_FOLDER_ID, 'Spotlight 活動圖片 Google Drive 資料夾 ID'],
    ['ACTIVITY_FOLDER_URL', '', 'Spotlight 活動圖片 Google Drive 資料夾完整網址（可自訂）'],
    ['TICKER_MESSAGE', '🌟 歡迎來到諾貝爾 A 班！10/23 (五) 為全園牙齒塗氟日，請家長記得備妥健保卡喔！', '頂部即時公告走馬燈訊息']
  ];
  setSheet.getRange(2, 1, sampleSettings.length, 3).setValues(sampleSettings);

  // 自動調整所有欄寬
  [eventsSheet, menusSheet, spSheet, docsSheet, setSheet].forEach(sh => {
    sh.autoResizeColumns(1, sh.getLastColumn());
  });

  console.log('Database initialized successfully!');
  clearAppDataCache();
  return { success: true, message: '試算表資料庫初始化完成！' };
}
