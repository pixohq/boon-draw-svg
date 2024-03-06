exports.extractContentFromURL = (urlString) => {
  const urlRegex = /url\((['"])?(.*?)\1\)/;
  const match = urlString.match(urlRegex);

  return match ? match[2] : null;
};
