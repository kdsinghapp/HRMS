export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: result.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      // ✅ validated & sanitized data
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Validation middleware error",
      });
    }
  };
};
