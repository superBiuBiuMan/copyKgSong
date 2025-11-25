import db from "./db.js";

console.log("开始修复数据库中的 user_id 格式...");

// 查看当前数据
const before = db.prepare("SELECT id, user_id FROM backups").all();
console.log("修复前的数据:", before);

// 更新所有带 .0 后缀的 user_id
const stmt = db.prepare(`
  UPDATE backups 
  SET user_id = REPLACE(user_id, '.0', '') 
  WHERE user_id LIKE '%.0'
`);

const result = stmt.run();
console.log(`已修复 ${result.changes} 条记录`);

// 查看修复后的数据
const after = db.prepare("SELECT id, user_id FROM backups").all();
console.log("修复后的数据:", after);

console.log("✅ 数据修复完成！");
