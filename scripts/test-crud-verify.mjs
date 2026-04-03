// Verify CRUD with DB persistence checks
const BASE = "http://localhost:3000/api";
let cookie = "";

async function api(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json", Cookie: cookie } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${BASE}${path}`, opts);
  return r.json();
}

async function login() {
  const r = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usernameOrEmail: "admin", password: "admin1234" }) });
  cookie = r.headers.get("set-cookie").split(";")[0];
  console.log("Login:", (await r.json()).success ? "OK" : "FAILED");
}

const ts = Date.now();
let allPass = true;

function check(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}`);
    allPass = false;
  }
}

async function verifyAccessZones() {
  console.log("\n===== ACCESS ZONES =====");
  
  // Create
  const cr = await api("POST", "/access-zones", {
    name: "DB Test Zone", nameEn: "DB Test Zone EN", type: "gate",
    hikvisionDoorId: `DBTEST${ts}`, buildingId: 1, floorId: 1, isActive: true
  });
  const id = cr.data?.zone?.id;
  check("Create", cr.success && id);

  // Verify in DB via GET
  const list1 = await api("GET", "/access-zones");
  const found1 = (list1.data?.zones || []).find(z => z.id === id);
  check("DB has created record", found1 && found1.name === "DB Test Zone");

  // Update
  const up = await api("PUT", `/access-zones/${id}`, {
    name: "DB Test Zone Updated", nameEn: "DB Test Zone Updated EN",
    type: "gate", hikvisionDoorId: `DBTEST${ts}`, isActive: true
  });
  check("Update", up.success);

  // Verify update in DB
  const list2 = await api("GET", "/access-zones");
  const found2 = (list2.data?.zones || []).find(z => z.id === id);
  check("DB has updated record", found2 && found2.name === "DB Test Zone Updated");

  // Delete
  const del = await api("DELETE", `/access-zones/${id}`);
  check("Delete", del.success);

  // Verify deletion
  const list3 = await api("GET", "/access-zones");
  const found3 = (list3.data?.zones || []).find(z => z.id === id);
  check("DB record deleted", !found3);
}

async function verifyApproverGroups() {
  console.log("\n===== APPROVER GROUPS =====");
  
  const cr = await api("POST", "/approver-groups", {
    name: "DB Test Group", nameEn: "DB Test Group EN", departmentId: 1, description: "DB test"
  });
  const id = cr.data?.group?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/approver-groups");
  const found1 = (list1.data?.groups || []).find(g => g.id === id);
  check("DB has created record", found1 && found1.name === "DB Test Group");

  const up = await api("PUT", `/approver-groups/${id}`, {
    name: "DB Test Group Updated", nameEn: "DB Test Group Updated EN", departmentId: 1
  });
  check("Update", up.success);

  const list2 = await api("GET", "/approver-groups");
  const found2 = (list2.data?.groups || []).find(g => g.id === id);
  check("DB has updated record", found2 && found2.name === "DB Test Group Updated");

  const del = await api("DELETE", `/approver-groups/${id}`);
  check("Delete", del.success);

  const list3 = await api("GET", "/approver-groups");
  const found3 = (list3.data?.groups || []).find(g => g.id === id);
  check("DB record deleted", !found3);
}

async function verifyUsers() {
  console.log("\n===== USERS =====");
  
  const cr = await api("POST", "/users", {
    username: `dbtest${ts}`, email: `dbtest${ts}@test.com`, password: "test1234",
    firstName: "DBTest", lastName: "User", role: "staff", userType: "staff"
  });
  const id = cr.data?.user?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/users");
  const users1 = list1.data?.users || [];
  const found1 = users1.find(u => u.id === id);
  check("DB has created record", found1 && found1.firstName === "DBTest");

  const up = await api("PATCH", `/users/${id}/role`, { role: "supervisor" });
  check("Update (role change)", up.success);

  const list2 = await api("GET", "/users");
  const users2 = list2.data?.users || [];
  const found2 = users2.find(u => u.id === id);
  check("DB has updated role", found2 && found2.role === "supervisor");

  const lock = await api("PATCH", `/users/${id}/lock`, { isActive: false });
  check("Lock (disable)", lock.success);

  const list3 = await api("GET", "/users");
  const users3 = list3.data?.users || [];
  const found3 = users3.find(u => u.id === id);
  check("DB has locked user", found3 && (found3.isActive === false || found3.status === "locked" || found3.status === "inactive"));
}

async function verifyStaff() {
  console.log("\n===== STAFF =====");
  
  const cr = await api("POST", "/staff", {
    employeeId: `DBTEST${ts}`, name: "DBTest Staff", nameEn: "DBTest Staff EN",
    position: "Tester", departmentId: 1, email: `dbstaff${ts}@test.com`, phone: "0812345678", role: "staff"
  });
  const id = cr.data?.staff?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/staff");
  const staff1 = list1.data?.staff || [];
  const found1 = staff1.find(s => s.id === id);
  check("DB has created record", found1 && found1.name === "DBTest Staff");

  const up = await api("PUT", `/staff/${id}`, {
    name: "DBTest Staff Updated", nameEn: "DBTest Staff Updated EN",
    position: "Senior Tester", departmentId: 1, email: `dbstaff${ts}@test.com`, phone: "0899999999"
  });
  check("Update", up.success);

  const list2 = await api("GET", "/staff");
  const staff2 = list2.data?.staff || [];
  const found2 = staff2.find(s => s.id === id);
  check("DB has updated record", found2 && found2.name === "DBTest Staff Updated");

  const del = await api("DELETE", `/staff/${id}`);
  check("Delete (soft)", del.success);

  const list3 = await api("GET", "/staff");
  const staff3 = list3.data?.staff || [];
  const found3 = staff3.find(s => s.id === id);
  check("DB record soft-deleted", !found3 || found3.status === "inactive");
}

async function verifyServicePoints() {
  console.log("\n===== SERVICE POINTS =====");
  
  const cr = await api("POST", "/service-points", {
    name: "DB Test Kiosk", nameEn: "DB Test Kiosk EN", type: "kiosk",
    serialNumber: `SN-DB-${ts}`, location: "Lobby", locationEn: "Lobby",
    building: "A", floor: "1F", ipAddress: "10.0.0.1", macAddress: "11:22:33:44:55:66"
  });
  const id = cr.data?.servicePoint?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/service-points");
  const sp1 = list1.data?.servicePoints || [];
  const found1 = sp1.find(s => s.id === id);
  check("DB has created record", found1 && found1.name === "DB Test Kiosk");

  const up = await api("PUT", `/service-points/${id}`, {
    name: "DB Test Kiosk Updated", nameEn: "DB Test Kiosk Updated EN",
    type: "kiosk", serialNumber: `SN-DB-${ts}`, location: "Lobby B", locationEn: "Lobby B",
    building: "B", floor: "2F", ipAddress: "10.0.0.2", macAddress: "11:22:33:44:55:66"
  });
  check("Update", up.success);

  const list2 = await api("GET", "/service-points");
  const sp2 = list2.data?.servicePoints || [];
  const found2 = sp2.find(s => s.id === id);
  check("DB has updated record", found2 && found2.name === "DB Test Kiosk Updated");

  const del = await api("DELETE", `/service-points/${id}`);
  check("Delete", del.success);

  const list3 = await api("GET", "/service-points");
  const sp3 = list3.data?.servicePoints || [];
  const found3 = sp3.find(s => s.id === id);
  check("DB record deleted", !found3);
}

async function verifyDocumentTypes() {
  console.log("\n===== DOCUMENT TYPES =====");
  
  const cr = await api("POST", "/document-types", {
    name: "DB Test Doc", nameEn: "DB Test Doc EN", category: "other",
    requirePhoto: false, isActive: true, sortOrder: 999
  });
  const id = cr.data?.documentType?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/document-types");
  const docs1 = list1.data?.documentTypes || [];
  const found1 = docs1.find(d => d.id === id);
  check("DB has created record", found1 && found1.name === "DB Test Doc");

  const up = await api("PUT", `/document-types/${id}`, {
    name: "DB Test Doc Updated", nameEn: "DB Test Doc Updated EN", isActive: true
  });
  check("Update", up.success);

  const list2 = await api("GET", "/document-types");
  const docs2 = list2.data?.documentTypes || [];
  const found2 = docs2.find(d => d.id === id);
  check("DB has updated record", found2 && found2.name === "DB Test Doc Updated");

  const del = await api("DELETE", `/document-types/${id}`);
  check("Delete", del.success);

  const list3 = await api("GET", "/document-types");
  const docs3 = list3.data?.documentTypes || [];
  const found3 = docs3.find(d => d.id === id);
  check("DB record deleted", !found3);
}

async function verifyBusinessHours() {
  console.log("\n===== BUSINESS HOURS =====");
  
  // Create via upsert
  const cr = await api("PUT", "/business-hours", {
    rules: [{
      name: "DB Test Rule", nameEn: "DB Test Rule EN", type: "special",
      specificDate: "2027-01-15", openTime: "09:00", closeTime: "12:00",
      isActive: true, allowWalkin: true, allowKiosk: true
    }]
  });
  const ruleId = cr.data?.rules?.[0]?.id;
  check("Create (via PUT)", cr.success && ruleId);

  const list1 = await api("GET", "/business-hours");
  const rules1 = list1.data?.rules || [];
  const found1 = rules1.find(r => r.id === ruleId);
  check("DB has created rule", found1 && found1.name === "DB Test Rule");

  // Update existing rule
  const up = await api("PUT", "/business-hours", {
    rules: [{
      id: ruleId, name: "DB Test Rule Updated", nameEn: "DB Test Rule Updated EN",
      type: "special", specificDate: "2027-01-15", openTime: "10:00", closeTime: "14:00",
      isActive: true, allowWalkin: true, allowKiosk: true
    }]
  });
  check("Update", up.success);

  const list2 = await api("GET", "/business-hours");
  const rules2 = list2.data?.rules || [];
  const found2 = rules2.find(r => r.id === ruleId);
  check("DB has updated rule", found2 && found2.name === "DB Test Rule Updated");

  // Holiday create/delete
  const hol = await api("POST", "/business-hours/holidays", { date: "2027-06-15", name: "DB Test Holiday" });
  check("Create holiday", hol.success);

  const del = await api("DELETE", "/business-hours/holidays?date=2027-06-15");
  check("Delete holiday", del.success);
}

async function verifyNotificationTemplates() {
  console.log("\n===== NOTIFICATION TEMPLATES =====");
  
  const cr = await api("POST", "/notification-templates", {
    name: "DB Test Template", nameEn: "DB Test Template EN",
    channel: "line", triggerEvent: "checkin_complete",
    bodyTh: "Hello {{visitor_name}}", bodyEn: "Hello {{visitor_name}}",
    isActive: true, variables: ["visitor_name"]
  });
  const id = cr.data?.template?.id;
  check("Create", cr.success && id);

  const list1 = await api("GET", "/notification-templates");
  const tmpl1 = list1.data?.templates || [];
  const found1 = tmpl1.find(t => t.id === id);
  check("DB has created template", found1 && found1.name === "DB Test Template");

  const up = await api("PUT", `/notification-templates/${id}`, {
    name: "DB Test Template Updated", nameEn: "DB Test Template Updated EN",
    channel: "line", triggerEvent: "checkin_complete",
    bodyTh: "Updated {{visitor_name}}", bodyEn: "Updated {{visitor_name}}",
    isActive: true, variables: ["visitor_name"]
  });
  check("Update", up.success);

  const list2 = await api("GET", "/notification-templates");
  const tmpl2 = list2.data?.templates || [];
  const found2 = tmpl2.find(t => t.id === id);
  check("DB has updated template", found2 && found2.name === "DB Test Template Updated");

  const del = await api("DELETE", `/notification-templates/${id}`);
  check("Delete", del.success);

  const list3 = await api("GET", "/notification-templates");
  const tmpl3 = list3.data?.templates || [];
  const found3 = tmpl3.find(t => t.id === id);
  check("DB record deleted", !found3);
}

async function verifyPdpaConsent() {
  console.log("\n===== PDPA CONSENT =====");
  
  // Get current version
  const before = await api("GET", "/pdpa/config");
  const vBefore = before.data?.config?.version ?? before.data?.version ?? 0;
  check("GET current config", before.success);
  console.log(`  Current version: ${vBefore}`);

  // Create new version
  const up = await api("PUT", "/pdpa/config", {
    titleTh: "DB Test PDPA", titleEn: "DB Test PDPA EN",
    contentTh: "DB Test PDPA Content TH", contentEn: "DB Test PDPA Content EN",
    retentionDays: 730, requireScroll: true,
    displayChannels: ["kiosk", "line"], changeNotes: "DB verification test"
  });
  check("Create new version", up.success);

  const after = await api("GET", "/pdpa/config");
  const vAfter = after.data?.config?.version ?? after.data?.version ?? 0;
  check("Version incremented", vAfter > vBefore);
  console.log(`  New version: ${vAfter}`);
}

async function main() {
  await login();

  await verifyAccessZones();
  await verifyApproverGroups();
  await verifyUsers();
  await verifyStaff();
  await verifyServicePoints();
  await verifyDocumentTypes();
  await verifyBusinessHours();
  await verifyNotificationTemplates();
  await verifyPdpaConsent();

  console.log("\n===== FINAL RESULT =====");
  console.log(allPass ? "ALL CHECKS PASSED!" : "SOME CHECKS FAILED!");
  process.exit(allPass ? 0 : 1);
}

main().catch(console.error);
