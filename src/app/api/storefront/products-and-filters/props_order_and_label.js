export const propsOrderAndLabels = {
  "Categories": "Category",
  ...(process.env.CUSTOM_FIELDS_AS_FILTERS
    ?.split(',')
    .map(v => v.trim())
    .filter(Boolean)
    .reduce((acc, v) => {
      acc[v] = v;
      return acc;
    }, {}))
};