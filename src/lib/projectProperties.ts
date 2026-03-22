import properties from "../config/projectProperties.json";

export const PROJECT_PROPERTIES = properties;

export type ProjectPropertyId = typeof PROJECT_PROPERTIES[number]["id"];
