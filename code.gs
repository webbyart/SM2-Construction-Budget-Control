
const SPREADSHEET_ID = '1_SdZv-8jhrjl-k-mawppG2oe_3g1QlzUn2Z46Z61t70';

function doGet(e) {
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput('<h1>SM2 Control System</h1><p>Application is ready.</p>');
  }

  const action = e.parameter.action;
  if (action) {
    let result;
    let args = [];
    
    try {
      if (e.parameter.args) {
        args = JSON.parse(decodeURIComponent(e.parameter.args));
      }
    } catch (parseError) {
      return createJsonResponse({ success: false, message: 'Invalid arguments format' });
    }

    try {
      if (action === 'authenticateUser') result = authenticateUser(...args);
      else if (action === 'getAllProjects') result = getAllProjects();
      else if (action === 'saveProject') result = saveProject(...args);
      else if (action === 'deleteProject') result = deleteProject(...args);
      else if (action === 'addCutRecord') result = addCutRecord(...args);
      else if (action === 'updateCutRecord') result = updateCutRecord(...args);
      else if (action === 'deleteRecord') result = deleteRecord(...args);
      else if (action === 'getAllCutRecords') result = getAllCutRecords();
      else if (action === 'getDashboardData') result = getDashboardData();
      else if (action === 'getAllUsers') result = getAllUsers();
      else if (action === 'addUser') result = addUser(...args);
      else if (action === 'deleteUser') result = deleteUser(...args);
      else if (action === 'getNetworkDefinitions') result = getNetworkDefinitions();
      else if (action === 'saveNetworkDefinition') result = saveNetworkDefinition(...args);
      else if (action === 'deleteNetworkDefinition') result = deleteNetworkDefinition(...args);
      else if (action === 'getAllWorkers') result = getAllWorkers();
      else if (action === 'saveWorker') result = saveWorker(...args);
      else if (action === 'deleteWorker') result = deleteWorker(...args);
      else throw new Error('Action "' + action + '" not found');

      return createJsonResponse({ success: true, data: result });
    } catch (error) {
      return createJsonResponse({ success: false, message: error.toString() });
    }
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('SM2 Control System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'Projects') {
      sheet.appendRow(['wbs', 'name', 'worker', 'networkCode', 'networkName', 'labor_current', 'supervise_current', 'transport_current', 'misc_current', 'labor_full', 'supervise_full', 'transport_full', 'misc_full', 'maxBudgetPercent', 'approvalNumber', 'approvalDate']);
    } else if (name === 'Records') {
      sheet.appendRow(['WBS', 'networkCode', 'วันที่', 'รายละเอียด', 'ค่าแรง', 'ควบคุมงาน', 'ขนส่ง', 'เบ็ดเตล็ด', 'RecordID']);
    } else if (name === 'Users') {
      sheet.appendRow(['Username', 'Password', 'Role']);
      sheet.appendRow(['admin', '1234', 'admin']);
    } else if (name === 'Detail') {
      sheet.appendRow(['Code', 'Name']);
    } else if (name === 'Workers') {
      sheet.appendRow(['ID', 'Name', 'Position']);
    }
  }
  return sheet;
}

function getNetworkDefinitions() {
  const sheet = getSheet('Detail');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return data.map(r => ({ 
    code: r[0] ? r[0].toString().trim() : '', 
    name: r[1] ? r[1].toString().trim() : '' 
  })).filter(item => item.code !== '');
}

function saveNetworkDefinition(def) {
  const sheet = getSheet('Detail');
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === def.code.toString().trim()) {
      sheet.getRange(i + 1, 2).setValue(def.name);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([def.code, def.name]);
  return { success: true };
}

function deleteNetworkDefinition(code) {
  const sheet = getSheet('Detail');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === code.toString().trim()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function getAllWorkers() {
  const sheet = getSheet('Workers');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return data.map(r => ({ 
    id: r[0] ? r[0].toString().trim() : '', 
    name: r[1] ? r[1].toString().trim() : '', 
    position: r[2] ? r[2].toString().trim() : '' 
  })).filter(item => item.name !== '');
}

function saveWorker(w) {
  const sheet = getSheet('Workers');
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === w.id.toString().trim()) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[w.name, w.position]]);
      found = true;
      break;
    }
  }
  if (!found) sheet.appendRow([w.id, w.name, w.position]);
  return { success: true };
}

function deleteWorker(id) {
  const sheet = getSheet('Workers');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === id.toString().trim()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function authenticateUser(username, password) {
  const data = getSheet('Users').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === username && data[i][1].toString().trim() === password) {
      return { success: true, username: data[i][0], role: data[i][2] };
    }
  }
  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

function getAllUsers() {
  const data = getSheet('Users').getDataRange().getValues();
  return data.slice(1).map(r => ({ username: r[0], role: r[2] }));
}

function addUser(u) {
  getSheet('Users').appendRow([u.username, u.password, u.role]);
  return { success: true };
}

function deleteUser(username) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function getAllProjects() {
  const sheet = getSheet('Projects');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  const projectsMap = {};
  for (let i = 0; i < data.length; i++) {
    const wbs = data[i][0];
    if (!wbs) continue;
    if (!projectsMap[wbs]) {
      projectsMap[wbs] = { 
        wbs: wbs, 
        name: data[i][1], 
        worker: data[i][2], 
        maxBudgetPercent: Number(data[i][13]) || 80, 
        approvalNumber: data[i][14] || '',
        approvalDate: data[i][15] || '',
        networks: [] 
      };
    }
    projectsMap[wbs].networks.push({
      networkCode: data[i][3] ? data[i][3].toString() : '',
      networkName: data[i][4] ? data[i][4].toString() : '',
      labor_balance: Number(data[i][5]) || 0, 
      supervise_balance: Number(data[i][6]) || 0, 
      transport_balance: Number(data[i][7]) || 0, 
      misc_balance: Number(data[i][8]) || 0,
      labor_full: Number(data[i][9]) || 0, 
      supervise_full: Number(data[i][10]) || 0, 
      transport_full: Number(data[i][11]) || 0, 
      misc_full: Number(data[i][12]) || 0
    });
  }
  return Object.values(projectsMap);
}

function saveProject(p) {
  const sheet = getSheet('Projects');
  const data = sheet.getDataRange().getValues();
  // Delete existing rows for this WBS
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0].toString().trim().toUpperCase() === p.wbs.toString().trim().toUpperCase()) {
      sheet.deleteRow(i + 1);
    }
  }
  // Append new rows for each network
  if (p.networks && p.networks.length > 0) {
    p.networks.forEach(n => {
      sheet.appendRow([
        p.wbs, 
        p.name, 
        p.worker, 
        n.networkCode || '', 
        n.networkName || '',
        n.labor_balance !== undefined ? n.labor_balance : n.labor_full, 
        n.supervise_balance !== undefined ? n.supervise_balance : n.supervise_full, 
        n.transport_balance !== undefined ? n.transport_balance : n.transport_full, 
        n.misc_balance !== undefined ? n.misc_balance : n.misc_full, 
        n.labor_full || 0, 
        n.supervise_full || 0, 
        n.transport_full || 0, 
        n.misc_full || 0, 
        p.maxBudgetPercent, 
        p.approvalNumber || '', 
        p.approvalDate || ''
      ]);
    });
  }
  return { success: true };
}

function deleteProject(wbs) {
  const sheet = getSheet('Projects');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0].toString().trim().toUpperCase() === wbs.toString().trim().toUpperCase()) {
      sheet.deleteRow(i + 1);
    }
  }
  return { success: true };
}

function addCutRecord(r) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const pSheet = getSheet('Projects');
    const pData = pSheet.getDataRange().getValues();
    let targetRow = -1;
    let networkPoolFull = 0;
    let maxPercent = 0;

    // หาแถวเป้าหมายและคำนวณงบเต็ม "เฉพาะโครงข่ายที่เลือก"
    for (let i = 1; i < pData.length; i++) {
      if (pData[i][0].toString().trim().toUpperCase() === r.wbs.toString().trim().toUpperCase()) {
        maxPercent = Number(pData[i][13]);
        if (pData[i][3].toString() === r.networkCode.toString()) {
          targetRow = i + 1;
          networkPoolFull = (Number(pData[i][9]) + Number(pData[i][10]) + Number(pData[i][11]) + Number(pData[i][12]));
        }
      }
    }

    if (targetRow === -1) throw new Error("ไม่พบรหัสโครงข่าย " + r.networkCode);
    
    // เพดานงบ "รายโครงข่าย"
    const networkLimit = networkPoolFull * (maxPercent / 100);
    
    // คำนวณยอดที่ตัดไปแล้ว "เฉพาะโครงข่ายที่เลือก"
    const recSheet = getSheet('Records');
    const recData = recSheet.getDataRange().getValues();
    let sumCutsInNetwork = 0;
    for (let i = 1; i < recData.length; i++) {
      if (recData[i][0].toString().trim().toUpperCase() === r.wbs.toString().trim().toUpperCase() && 
          recData[i][1].toString() === r.networkCode.toString()) {
        sumCutsInNetwork += (Number(recData[i][4]) + Number(recData[i][5]) + Number(recData[i][6]) + Number(recData[i][7]));
      }
    }

    const newCutTotal = Number(r.labor) + Number(r.supervise) + Number(r.transport) + Number(r.misc);
    
    // ตรวจสอบห้ามเกินเพดานรายโครงข่าย
    if (sumCutsInNetwork + newCutTotal > networkLimit + 0.1) {
      throw new Error("ยอดตัดรวมของโครงข่าย " + r.networkCode + " เกินเพดาน " + maxPercent + "% (ตัดได้สูงสุดรวม: " + networkLimit.toFixed(2) + ")");
    }

    const currentValues = pSheet.getRange(targetRow, 6, 1, 4).getValues()[0];
    pSheet.getRange(targetRow, 6).setValue(Number(currentValues[0]) - r.labor);
    pSheet.getRange(targetRow, 7).setValue(Number(currentValues[1]) - r.supervise);
    pSheet.getRange(targetRow, 8).setValue(Number(currentValues[2]) - r.transport);
    pSheet.getRange(targetRow, 9).setValue(Number(currentValues[3]) - r.misc);

    const recordID = "REC-" + new Date().getTime();
    recSheet.appendRow([r.wbs, r.networkCode, new Date(), r.detail, r.labor, r.supervise, r.transport, r.misc, recordID]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function updateCutRecord(recordID, r) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const recSheet = getSheet('Records');
    const data = recSheet.getDataRange().getValues();
    let recRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][8] === recordID) {
        recRow = i + 1;
        break;
      }
    }
    if (recRow === -1) throw new Error("ไม่พบรายการที่ต้องการแก้ไข");

    const oldWbs = data[recRow-1][0];
    const oldNet = data[recRow-1][1];
    const oldCuts = [data[recRow-1][4], data[recRow-1][5], data[recRow-1][6], data[recRow-1][7]];
    
    const pSheet = getSheet('Projects');
    const pData = pSheet.getDataRange().getValues();
    
    for (let j = 1; j < pData.length; j++) {
      if (pData[j][0].toString().trim().toUpperCase() === oldWbs.toString().trim().toUpperCase() && pData[j][3].toString() === oldNet.toString()) {
        const row = j + 1;
        pSheet.getRange(row, 6).setValue(Number(pData[j][5]) + Number(oldCuts[0]));
        pSheet.getRange(row, 7).setValue(Number(pData[j][6]) + Number(oldCuts[1]));
        pSheet.getRange(row, 8).setValue(Number(pData[j][7]) + Number(oldCuts[2]));
        pSheet.getRange(row, 9).setValue(Number(pData[j][8]) + Number(oldCuts[3]));
        break;
      }
    }

    recSheet.deleteRow(recRow);
    return addCutRecord(r);
  } finally {
    lock.releaseLock();
  }
}

function deleteRecord(recordID) {
  const recSheet = getSheet('Records');
  const data = recSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][8] === recordID) {
      const wbs = data[i][0];
      const net = data[i][1];
      const pSheet = getSheet('Projects');
      const pData = pSheet.getDataRange().getValues();
      for (let j = 1; j < pData.length; j++) {
        if (pData[j][0].toString().trim().toUpperCase() === wbs.toString().trim().toUpperCase() && pData[j][3].toString() === net.toString()) {
          const row = j + 1;
          pSheet.getRange(row, 6).setValue(Number(pData[j][5]) + Number(data[i][4]));
          pSheet.getRange(row, 7).setValue(Number(pData[j][6]) + Number(data[i][5]));
          pSheet.getRange(row, 8).setValue(Number(pData[j][7]) + Number(data[i][6]));
          pSheet.getRange(row, 9).setValue(Number(pData[j][8]) + Number(data[i][7]));
          break;
        }
      }
      recSheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function getAllCutRecords() {
  const recSheet = getSheet('Records');
  const lastRow = recSheet.getLastRow();
  if (lastRow < 2) return [];
  const recData = recSheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const projects = getAllProjects();
  const pMap = {};
  projects.forEach(p => pMap[p.wbs.toUpperCase()] = p);
  const results = [];
  for (let i = 0; i < recData.length; i++) {
    const wbs = recData[i][0];
    const project = pMap[wbs.toString().toUpperCase()] || { name: 'Unknown', worker: 'Unknown' };
    
    let dateVal = recData[i][2];
    let isoDate = "";
    try {
      if (dateVal instanceof Date) {
        isoDate = dateVal.toISOString();
      } else if (dateVal) {
        isoDate = new Date(dateVal).toISOString();
      }
    } catch (e) {
      isoDate = new Date().toISOString();
    }

    results.push({ 
      wbs: wbs, 
      networkCode: recData[i][1] ? recData[i][1].toString() : '', 
      projectName: project.name, 
      worker: project.worker, 
      date: isoDate, 
      detail: recData[i][3], 
      labor: recData[i][4], 
      supervise: recData[i][5], 
      transport: recData[i][6], 
      misc: recData[i][7], 
      id: recData[i][8] 
    });
  }
  return results.reverse();
}

function getDashboardData() {
  const projects = getAllProjects();
  const records = getAllCutRecords();
  let totalFull = 0;
  const workers = {};
  projects.forEach(p => {
    workers[p.worker] = (workers[p.worker] || 0) + 1;
    if (p.networks) { 
      p.networks.forEach(n => { 
        totalFull += (Number(n.labor_full) + Number(n.supervise_full) + Number(n.transport_full) + Number(n.misc_full)); 
      }); 
    }
  });
  return { 
    totalJobs: projects.length, 
    uniqueWorkers: Object.keys(workers).length, 
    totalBudget: totalFull, 
    jobsPerWorker: workers 
  };
}
