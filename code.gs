
const SPREADSHEET_ID = '1_SdZv-8jhrjl-k-mawppG2oe_3g1QlzUn2Z46Z61t70';

/**
 * ฟังก์ชันหลักสำหรับจัดการ Request
 * รองรับทั้งการเข้าชมผ่าน Browser (HTML) และการเรียกใช้แบบ API (JSON)
 */
function doGet(e) {
  // ตรวจสอบพารามิเตอร์เบื้องต้น
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput('<h1>SM2 Control System</h1><p>Application is ready. Please access via the provided Web App URL.</p>');
  }

  // จัดการ API Request (กรณีมี action)
  if (e.parameter.action) {
    let result;
    const action = e.parameter.action;
    let args = [];
    
    try {
      if (e.parameter.args) {
        const rawArgs = e.parameter.args;
        try {
          args = JSON.parse(rawArgs);
        } catch (e1) {
          // ถ้า parse ไม่ได้ในรอบแรก ให้ลอง decode ก่อน
          args = JSON.parse(decodeURIComponent(rawArgs));
        }
      }
    } catch (parseError) {
      return createJsonResponse({ success: false, message: 'Invalid arguments format: ' + parseError.toString() });
    }

    try {
      switch (action) {
        case 'authenticateUser': result = authenticateUser(...args); break;
        case 'getAllProjects': result = getAllProjects(); break;
        case 'addProject': result = addProject(...args); break;
        case 'updateProject': result = updateProject(...args); break;
        case 'deleteProject': result = deleteProject(...args); break;
        case 'addCutRecord': result = addCutRecord(...args); break;
        case 'deleteRecord': result = deleteRecord(...args); break;
        case 'getAllCutRecords': result = getAllCutRecords(); break;
        case 'getDashboardData': result = getDashboardData(); break;
        case 'getAllUsers': result = getAllUsers(); break;
        case 'addUser': result = addUser(...args); break;
        case 'deleteUser': result = deleteUser(...args); break;
        default: throw new Error('Action "' + action + '" not recognized');
      }
      return createJsonResponse(result);
    } catch (error) {
      return createJsonResponse({ success: false, message: 'Server Logic Error: ' + error.toString() });
    }
  }

  // กรณีเข้าชม UI ปกติ
  try {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('SM2 Control System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    return HtmlService.createHtmlOutput('<h1>Interface Error</h1><p>' + err.toString() + '</p>');
  }
}

/**
 * ฟังก์ชันช่วยสร้าง JSON Response พร้อมส่งออก (ContentService ช่วยเรื่อง CORS อัตโนมัติ)
 */
function createJsonResponse(data) {
  const jsonOutput = JSON.stringify(data || {});
  return ContentService.createTextOutput(jsonOutput)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ช่วยจัดการดึง Sheet หรือสร้างใหม่ถ้าไม่มี
 */
function getSheet(name) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      if (name === 'Projects') {
        sheet.appendRow(['wbs', 'name', 'worker', 'labor_current', 'supervise_current', 'transport_current', 'misc_current', 'labor_full', 'supervise_full', 'transport_full', 'misc_full', 'maxBudgetPercent']);
      } else if (name === 'Records') {
        sheet.appendRow(['WBS', 'วันที่', 'รายละเอียด', 'ค่าแรง', 'ควบคุมงาน', 'ขนส่ง', 'เบ็ดเตล็ด', 'RecordID']);
      } else if (name === 'Users') {
        sheet.appendRow(['Username', 'Password', 'Role']);
        sheet.appendRow(['admin', '1234', 'admin']);
      }
    }
    return sheet;
  } catch (e) {
    throw new Error('ไม่สามารถเข้าถึง Spreadsheet ได้: ' + e.message);
  }
}

function authenticateUser(username, password) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === username.toString().trim() && data[i][1].toString().trim() === password.toString().trim()) {
      return { success: true, username: data[i][0], role: data[i][2], message: 'เข้าสู่ระบบสำเร็จ' };
    }
  }
  return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
}

function getAllProjects() {
  const sheet = getSheet('Projects');
  const data = sheet.getDataRange().getValues();
  const projects = [];
  for (let i = 1; i < data.length; i++) {
    projects.push({
      wbs: data[i][0],
      name: data[i][1],
      worker: data[i][2],
      labor: data[i][3],
      supervise: data[i][4],
      transport: data[i][5],
      misc: data[i][6],
      labor_full: data[i][7],
      supervise_full: data[i][8],
      transport_full: data[i][9],
      misc_full: data[i][10],
      maxBudgetPercent: data[i][11],
      rowIndex: i + 1
    });
  }
  return projects;
}

function addProject(p) {
  const sheet = getSheet('Projects');
  sheet.appendRow([
    p.wbs, p.name, p.worker, 
    p.labor_current, p.supervise_current, p.transport_current, p.misc_current,
    p.labor_full, p.supervise_full, p.transport_full, p.misc_full,
    p.maxBudgetPercent
  ]);
  return { success: true, message: 'เพิ่มโครงการสำเร็จ' };
}

function updateProject(p) {
  const sheet = getSheet('Projects');
  if (p.rowIndex) {
    sheet.getRange(p.rowIndex, 1, 1, 12).setValues([[
      p.wbs, p.name, p.worker, 
      p.labor_current, p.supervise_current, p.transport_current, p.misc_current,
      p.labor_full, p.supervise_full, p.transport_full, p.misc_full,
      p.maxBudgetPercent
    ]]);
    return { success: true, message: 'อัปเดตข้อมูลสำเร็จ' };
  }
  return { success: false, message: 'ไม่พบตำแหน่งแถวที่ต้องการแก้ไข' };
}

function deleteProject(wbs) {
  const sheet = getSheet('Projects');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === wbs.toString()) {
      sheet.deleteRow(i + 1);
      const recSheet = getSheet('Records');
      const recData = recSheet.getDataRange().getValues();
      for (let j = recData.length - 1; j >= 1; j--) {
        if (recData[j][0].toString() === wbs.toString()) recSheet.deleteRow(j + 1);
      }
      return { success: true, message: 'ลบโครงการและประวัติเรียบร้อย' };
    }
  }
  return { success: false, message: 'ไม่พบรหัส WBS' };
}

function addCutRecord(r) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const pSheet = getSheet('Projects');
    const pData = pSheet.getDataRange().getValues();
    let projectRow = -1;
    let p = {};

    for (let i = 1; i < pData.length; i++) {
      if (pData[i][0].toString().trim() === r.wbs.toString().trim()) {
        projectRow = i + 1;
        p = {
          labor_curr: pData[i][3], supervise_curr: pData[i][4], transport_curr: pData[i][5], misc_curr: pData[i][6],
          labor_full: pData[i][7], supervise_full: pData[i][8], transport_full: pData[i][9], misc_full: pData[i][10],
          maxPercent: pData[i][11]
        };
        break;
      }
    }

    if (projectRow == -1) throw new Error("ไม่พบโครงการรหัส WBS นี้");

    const totalFull = p.labor_full + p.supervise_full + p.transport_full + p.misc_full;
    const globalLimit = totalFull * (p.maxPercent / 100);
    
    const recSheet = getSheet('Records');
    const recData = recSheet.getDataRange().getValues();
    let sumCuts = 0;
    for (let i = 1; i < recData.length; i++) {
      if (recData[i][0].toString().trim() === r.wbs.toString().trim()) {
        sumCuts += (Number(recData[i][3]) + Number(recData[i][4]) + Number(recData[i][5]) + Number(recData[i][6]));
      }
    }

    const newCutTotal = Number(r.labor) + Number(r.supervise) + Number(r.transport) + Number(r.misc);
    if (sumCuts + newCutTotal > globalLimit + 0.1) {
      throw new Error("ยอดตัดงบรวมจะเกินวงเงิน " + p.maxPercent + "% ที่กำหนดไว้ (ตัดได้สูงสุด " + globalLimit.toLocaleString() + " ฿)");
    }

    pSheet.getRange(projectRow, 4).setValue(p.labor_curr - r.labor);
    pSheet.getRange(projectRow, 5).setValue(p.supervise_curr - r.supervise);
    pSheet.getRange(projectRow, 6).setValue(p.transport_curr - r.transport);
    pSheet.getRange(projectRow, 7).setValue(p.misc_curr - r.misc);

    const recordID = "REC-" + new Date().getTime();
    recSheet.appendRow([r.wbs, new Date(), r.detail, r.labor, r.supervise, r.transport, r.misc, recordID]);

    return { success: true, message: 'บันทึกการตัดงบเรียบร้อย' };
  } catch (e) {
    return { success: false, message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function deleteRecord(recordID) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const recSheet = getSheet('Records');
    const recData = recSheet.getDataRange().getValues();
    let rowToToDelete = -1;
    let recordInfo = null;

    for (let i = 1; i < recData.length; i++) {
      if (recData[i][7] === recordID) {
        rowToToDelete = i + 1;
        recordInfo = {
          wbs: recData[i][0],
          labor: recData[i][3], supervise: recData[i][4], transport: recData[i][5], misc: recData[i][6]
        };
        break;
      }
    }

    if (rowToToDelete === -1) throw new Error("ไม่พบรายการตัดงบที่ต้องการลบ");

    const pSheet = getSheet('Projects');
    const pData = pSheet.getDataRange().getValues();
    for (let i = 1; i < pData.length; i++) {
      if (pData[i][0].toString().trim() === recordInfo.wbs.toString().trim()) {
        const pRow = i + 1;
        pSheet.getRange(pRow, 4).setValue(Number(pData[i][3]) + Number(recordInfo.labor));
        pSheet.getRange(pRow, 5).setValue(Number(pData[i][4]) + Number(recordInfo.supervise));
        pSheet.getRange(pRow, 6).setValue(Number(pData[i][5]) + Number(recordInfo.transport));
        pSheet.getRange(pRow, 7).setValue(Number(pData[i][6]) + Number(recordInfo.misc));
        break;
      }
    }

    recSheet.deleteRow(rowToToDelete);
    return { success: true, message: 'ลบรายการและคืนงบประมาณเรียบร้อย' };
  } catch (e) {
    return { success: false, message: e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getAllCutRecords() {
  const recSheet = getSheet('Records');
  const pSheet = getSheet('Projects');
  const recData = recSheet.getDataRange().getValues();
  const pData = pSheet.getDataRange().getValues();
  
  const pMap = {};
  for(let i=1; i<pData.length; i++) {
    pMap[pData[i][0]] = { name: pData[i][1], worker: pData[i][2] };
  }

  const records = [];
  for (let i = 1; i < recData.length; i++) {
    const wbs = recData[i][0];
    const project = pMap[wbs] || { name: 'Unknown', worker: 'Unknown' };
    records.push({
      wbs: wbs,
      projectName: project.name,
      worker: project.worker,
      date: recData[i][1],
      detail: recData[i][2],
      labor: recData[i][3],
      supervise: recData[i][4],
      transport: recData[i][5],
      misc: recData[i][6],
      id: recData[i][7]
    });
  }
  return records.reverse();
}

function getDashboardData() {
  const projects = getAllProjects();
  const records = getAllCutRecords();
  
  let totalBudget = 0;
  const workerCounts = {};
  projects.forEach(p => {
    totalBudget += (Number(p.labor_full) + Number(p.supervise_full) + Number(p.transport_full) + Number(p.misc_full));
    workerCounts[p.worker] = (workerCounts[p.worker] || 0) + 1;
  });

  return {
    totalJobs: projects.length,
    uniqueWorkers: Object.keys(workerCounts).length,
    totalBudget: totalBudget,
    jobsPerWorker: workerCounts
  };
}

function getAllUsers() {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    users.push({ username: data[i][0], role: data[i][2] });
  }
  return users;
}

function addUser(u) {
  const sheet = getSheet('Users');
  sheet.appendRow([u.username, u.password, u.role]);
  return { success: true, message: 'เพิ่มผู้ใช้สำเร็จ' };
}

function deleteUser(username) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == username) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'ลบผู้ใช้สำเร็จ' };
    }
  }
  return { success: false, message: 'ไม่พบผู้ใช้' };
}
