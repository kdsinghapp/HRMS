// utils/parseNestedFields.js
export const parseNestedFields = (flatObject) => {
  const result = {};
  for (const key in flatObject) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const part = keys[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    current[keys[keys.length - 1]] = flatObject[key];
  }
  return result;
};