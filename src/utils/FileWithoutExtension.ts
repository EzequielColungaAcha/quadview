export const removeExtension = (filename: string) => {
  const lastDotIndex = filename.lastIndexOf('.');
  // If there's no extension, return the full filename
  return lastDotIndex === -1 ? filename : filename.slice(0, lastDotIndex);
};
