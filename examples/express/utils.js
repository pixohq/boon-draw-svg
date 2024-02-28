const fs = require('fs');

// SVG 파일을 읽어들이는 함수
exports.readSVGFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

exports.extractContentFromURL = (urlString) => {
  const urlRegex = /url\((['"])?(.*?)\1\)/;
  const match = urlString.match(urlRegex);

  return match ? match[2] : null;
};
