import SystemSettings from "../../models/systemSettings.model.js";
import { createAuditLog } from "../../services/audit.service.js";
import { invalidateSystemSettingsCache } from "../../middlewares/maintenance.middleware.js";

// Ensures a settings document always exists so the frontend never has to
// deal with a 404 on first load.
const getOrCreateSettings = async () => {
  let settings = await SystemSettings.findOne({ singletonKey: "GLOBAL" });
  if (!settings) {
    settings = await SystemSettings.create({ singletonKey: "GLOBAL" });
  }
  return settings;
};

// GET /api/admin-panel/settings
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin-panel/settings
export const updateSystemSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const oldData = settings.toObject();

    // Merge nested objects instead of overwriting them wholesale so a
    // partial update (e.g. just workingHours.graceMinutes) doesn't wipe
    // out sibling fields.
    const body = req.body;
    for (const key of Object.keys(body)) {
      if (
        typeof body[key] === "object" &&
        body[key] !== null &&
        !Array.isArray(body[key])
      ) {
        settings[key] = { ...settings[key]?.toObject?.() ?? settings[key], ...body[key] };
      } else {
        settings[key] = body[key];
      }
    }
    settings.updatedBy = req.user.id;

    await settings.save();
    invalidateSystemSettingsCache();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "SYSTEM_SETTINGS",
      recordId: settings._id,
      oldData,
      newData: body,
      req,
    });

    res.status(200).json({ success: true, message: "Settings updated", data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/system-status
// Deliberately public and deliberately minimal — only what the frontend
// needs to decide whether to show the maintenance screen. Never expose the
// rest of SystemSettings here (company info, security config, etc.).
export const getPublicSystemStatus = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: {
          enabled: !!settings.maintenanceMode?.enabled,
          message: settings.maintenanceMode?.message || "",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
