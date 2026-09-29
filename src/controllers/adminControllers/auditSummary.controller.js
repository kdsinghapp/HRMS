import AuditLog from "../../models/auditLog.model.js";

// GET /api/admin-panel/audit-summary
// Lightweight aggregation used by the Admin dashboard — recent activity
// feed + a breakdown of actions by module. The full filterable log list is
// already served by /api/audit-logs (existing, HR+Admin gated) and reused
// as-is by the Admin Panel's Audit Logs page.
export const getAuditSummary = async (req, res) => {
  try {
    const [recent, byModule, byAction] = await Promise.all([
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10),
      AuditLog.aggregate([{ $group: { _id: "$module", count: { $sum: 1 } } }]),
      AuditLog.aggregate([{ $group: { _id: "$action", count: { $sum: 1 } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: { recent, byModule, byAction },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
